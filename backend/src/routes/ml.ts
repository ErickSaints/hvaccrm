import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { scopeToCustomer } from '../middleware/scopeToCustomer';
import { requirePermission } from '../middleware/permission';

const router = Router();

router.use(authenticate);

function calculateRisk(daysSinceLastService: number | null, daysSinceInstall: number | null): {
  failureProbability: number;
  estimatedDaysToFailure: number;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  recommendedAction: string;
  nextServiceRecommended: string;
} {
  if (daysSinceLastService === null && daysSinceInstall === null) {
    return {
      failureProbability: 0.1,
      estimatedDaysToFailure: 365,
      riskLevel: 'BAJO',
      recommendedAction: 'Registrar fecha de instalación para predicciones precisas',
      nextServiceRecommended: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    };
  }

  const daysSinceService = daysSinceLastService ?? daysSinceInstall ?? 999;
  const equipmentAge = daysSinceInstall ?? 0;

  let riskScore = 0;

  if (daysSinceService > 365) {
    riskScore += 0.5;
  } else if (daysSinceService > 180) {
    riskScore += 0.3;
  } else if (daysSinceService > 90) {
    riskScore += 0.15;
  }

  if (equipmentAge > 1825) {
    riskScore += 0.3;
  } else if (equipmentAge > 1095) {
    riskScore += 0.2;
  } else if (equipmentAge > 730) {
    riskScore += 0.1;
  }

  if (daysSinceService > 730) {
    riskScore += 0.2;
  }

  const clampedScore = Math.min(1, riskScore);

  let riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  let estimatedDaysToFailure: number;
  let recommendedAction: string;
  let nextServiceRecommended: string;

  if (clampedScore >= 0.7) {
    riskLevel = 'ALTO';
    estimatedDaysToFailure = Math.round(30 + (1 - clampedScore) * 60);
    recommendedAction = 'Programar servicio de mantenimiento urgente. Revisión completa recomendada.';
    nextServiceRecommended = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  } else if (clampedScore >= 0.35) {
    riskLevel = 'MEDIO';
    estimatedDaysToFailure = Math.round(90 + (1 - clampedScore) * 120);
    recommendedAction = 'Programar mantenimiento preventivo en los próximos 30 días.';
    nextServiceRecommended = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  } else {
    riskLevel = 'BAJO';
    estimatedDaysToFailure = Math.round(180 + (1 - clampedScore) * 185);
    recommendedAction = 'Mantenimiento preventivo de rutina. Equipo en condiciones normales.';
    nextServiceRecommended = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
  }

  return {
    failureProbability: Math.round(clampedScore * 100) / 100,
    estimatedDaysToFailure,
    riskLevel,
    recommendedAction,
    nextServiceRecommended,
  };
}

router.get('/predictions/:equipmentId', requirePermission('equipment:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.equipmentId));
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        serviceOrders: {
          where: { status: 'COMPLETADO' },
          orderBy: { completedDate: 'desc' },
          take: 5,
        },
        maintenanceLogs: {
          orderBy: { completedDate: 'desc' },
          take: 5,
        },
      } as any,
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    if (req.user!.role === 'CLIENT' && equipment.customerId !== req.user!.customerId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este equipo' });
    }

    const eq = equipment as any;
    const now = Date.now();
    const lastServiceDate = eq.lastService
      ? Math.floor((now - new Date(eq.lastService).getTime()) / 86400000)
      : null;
    const installDate = eq.installDate
      ? Math.floor((now - new Date(eq.installDate).getTime()) / 86400000)
      : null;

    const prediction = calculateRisk(lastServiceDate, installDate);

    const recentCompletedOrders = (eq.serviceOrders ?? []).filter(
      (o: any) => o.completedDate
    );

    res.json({
      equipmentId: eq.id,
      equipmentType: eq.type,
      equipmentBrand: eq.brand,
      equipmentModel: eq.model,
      installDate: eq.installDate,
      lastService: eq.lastService,
      lastServiceCompletedDate: recentCompletedOrders[0]?.completedDate ?? null,
      totalServiceOrders: recentCompletedOrders.length,
      ...prediction,
    });
  } catch (err) {
    console.error('ML prediction error:', err);
    res.status(500).json({ error: 'Error al generar predicción' });
  }
});

router.get('/predictions', requirePermission('equipment:view'), scopeToCustomer, async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.scopeFilter) {
      where.customerId = req.scopeFilter.customerId;
    }
    const allEquipment = await prisma.equipment.findMany({
      where,
      include: {
        serviceOrders: {
          where: { status: 'COMPLETADO' },
          orderBy: { completedDate: 'desc' },
          take: 1,
        },
      },
    });

    const predictions = allEquipment.map((eq) => {
      const now = Date.now();
      const lastServiceDate = eq.lastService
        ? Math.floor((now - new Date(eq.lastService).getTime()) / 86400000)
        : null;
      const installDate = eq.installDate
        ? Math.floor((now - new Date(eq.installDate).getTime()) / 86400000)
        : null;

      const prediction = calculateRisk(lastServiceDate, installDate);

      return {
        equipmentId: eq.id,
        equipmentType: eq.type,
        equipmentBrand: eq.brand,
        equipmentModel: eq.model,
        lastService: eq.lastService,
        ...prediction,
      };
    });

    predictions.sort((a, b) => b.failureProbability - a.failureProbability);

    res.json({
      generatedAt: new Date().toISOString(),
      total: predictions.length,
      highRisk: predictions.filter((p) => p.riskLevel === 'ALTO').length,
      mediumRisk: predictions.filter((p) => p.riskLevel === 'MEDIO').length,
      lowRisk: predictions.filter((p) => p.riskLevel === 'BAJO').length,
      predictions,
    });
  } catch (err) {
    console.error('ML batch prediction error:', err);
    res.status(500).json({ error: 'Error al generar predicciones' });
  }
});

export default router;
