import { collection, doc, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Grow, Plant } from '../types';

export const seedDatabase = async (userId: string) => {
  try {
    const batch = writeBatch(db);
    
    // Seed 3 Grows
    const growNames = ['BETA_MATRIX_01', 'GAMMA_CLONE_02', 'DELTA_VANGUARD_03'];
    const grows: Grow[] = [];

    for (let i = 0; i < growNames.length; i++) {
        const growRef = doc(collection(db, 'grows'));
        const growData: Grow = {
            id: growRef.id,
            name: growNames[i],
            strain: `HYBRID_STRAIN_0${i+1}`,
            startDate: { seconds: Math.floor(Date.now() / 1000) - (86400 * (30 + i * 10)), nanoseconds: 0 } as any,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ownerId: userId
        };
        batch.set(growRef, growData);
        grows.push(growData);
    }

    // Seed 15 Plants across the grows
    const plants: Plant[] = [];
    let plantCount = 1;
    for (const grow of grows) {
        for (let i = 0; i < 5; i++) {
            const plantRef = doc(collection(db, 'plants'));
            const plantData: Plant = {
                id: plantRef.id,
                growId: grow.id,
                name: `ASSET_${plantCount.toString().padStart(3, '0')}`,
                strain: grow.strain,
                germinationDate: grow.startDate,
                status: 'active',
                healthScore: 85 + Math.floor(Math.random() * 10),
                flags: [],
                logs: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                ownerId: userId
            };
            batch.set(plantRef, plantData);
            plants.push(plantData);
            plantCount++;
        }
    }

    // Seed 6 active findings (alerts)
    const findingTypes = [
        { title: 'VPD Anomaly Detected', rec: 'Adjust intake fan speed to increase RH. Current saturation deficit is stressing foliar structures.', sev: 'medium', cat: 'CLIMATE' },
        { title: 'Nutrient Burn Indicator', rec: 'Flush substrate with 5.8 pH RO water. EC levels detected at 3.2 mS/cm, exceeding maximum threshold.', sev: 'high', cat: 'NUTRITION' },
        { title: 'Substrate Moisture Critical', rec: 'Initiate emergency fertigation cycle. Dryback percentage has exceeded 65% limit.', sev: 'high', cat: 'IRRIGATION' },
        { title: 'Micro-pest Signature', rec: 'Deploy secondary IPM protocol. Visual cache analysis detected 2-pixel anomalous patterns consistent with thrip damage.', sev: 'medium', cat: 'PATHOGEN' },
        { title: 'Canopy Density Suboptimal', rec: 'Schedule aggressive defoliation for lower third. Light penetration compromised at Node 4.', sev: 'low', cat: 'STRUCTURE' },
        { title: 'EC Spike Detected', rec: 'Calibrate Dosatron. Input EC deviated by +0.4 from target vector over last 2 feed events.', sev: 'high', cat: 'SYSTEM' }
    ];

    for (let i = 0; i < findingTypes.length; i++) {
        const targetPlant = plants[i % plants.length];
        const findingRef = doc(collection(db, 'plant_findings'));
        const type = findingTypes[i];
        
        batch.set(findingRef, {
            id: findingRef.id,
            userId: userId,
            growId: targetPlant.growId,
            plantId: targetPlant.id,
            mediaAssetId: null,
            title: type.title,
            description: type.rec,
            recommendation: type.rec,
            severity: type.sev,
            category: type.cat,
            status: 'active',
            createdAt: serverTimestamp()
        });
    }

    await batch.commit();
    return { success: true, message: 'Seeding complete' };
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
};
