import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { OBJ_RAW_TEXT } from './SchoolModelData';

// --- DATA TYPES ---
interface HeatmapData {
    location: string;
    riskScore: number;
    recentMoods: string[]; // Hex colors
}

interface SchoolModelProps {
    viewMode: '2D' | '3D';
    heatmapData: HeatmapData[];
}

// --- CONSTANTS ---
const BUILDING_LIST = [
    'AQ1', 'AQ2', 'AQ3', 'AQ4', 'ElectricityBuilding', 'SideBuilding',
    'GirlDorm', 'BoyDorm', 'Canteen', 'SwimmingPool', 'DormAB', 'DormCD',
    'Gymnasium', 'AdministrationBuilding', 'BasketballCourt'
];

// Map Chinese location names (from DB) to English Mesh Names (in OBJ)
const LOCATION_MAPPING: Record<string, string> = {
    '电力楼': 'ElectricityBuilding',
    '侧楼': 'SideBuilding',
    '女生宿舍': 'GirlDorm',
    '男生宿舍': 'BoyDorm',
    '食堂': 'Canteen',
    '游泳馆': 'SwimmingPool',
    '宿舍AB': 'DormAB',
    '宿舍CD': 'DormCD',
    '行政楼': 'AdministrationBuilding',
    '体育馆': 'Gymnasium',
    '篮球场': 'BasketballCourt',
    // English to English fallback
    'ElectricityBuilding': 'ElectricityBuilding',
    'SideBuilding': 'SideBuilding',
    'GirlDorm': 'GirlDorm',
    'BoyDorm': 'BoyDorm',
    'Canteen': 'Canteen',
    'SwimmingPool': 'SwimmingPool',
    'DormAB': 'DormAB',
    'DormCD': 'DormCD',
    'AdministrationBuilding': 'AdministrationBuilding',
    'Gymnasium': 'Gymnasium',
    'BasketballCourt': 'BasketballCourt',
    'AQ1': 'AQ1', 'AQ2': 'AQ2', 'AQ3': 'AQ3', 'AQ4': 'AQ4'
};
// Reverse mapping to find data for a building
const findDataForBuilding = (buildingName: string, data: HeatmapData[]) => {
    return data.find(d => {
        // Direct match
        if (d.location === buildingName) return true;
        // Mapped match (if d.location is Chinese, map it to English and compare)
        const mappedInfo = LOCATION_MAPPING[d.location];
        return mappedInfo === buildingName;
    });
};

// Color Interpolation for Risk (Green -> Red)
const getRiskColor = (risk: number) => {
    const safeColor = new THREE.Color('#98FF98');
    const dangerColor = new THREE.Color('#B22222');
    return safeColor.lerp(dangerColor, Math.max(0, Math.min(1, risk)));
};

// --- PARTICLE SYSTEM ---
// Logic: 1 Student Feedback = 1 Particle floating above
const ParticleSystem: React.FC<{ position: THREE.Vector3; moods: string[] }> = ({ position, moods }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Bobbing Animation
    useFrame((state) => {
        if (groupRef.current) {
            // Gentle sine wave bobbing
            groupRef.current.position.y = position.y + 20 + Math.sin(state.clock.elapsedTime * 2) * 1.5;
        }
    });

    if (!moods || moods.length === 0) return null;

    return (
        <group ref={groupRef} position={[position.x, 0, position.z]}>
            {moods.map((color, i) => {
                // Spiral Distribution for visibility
                // If 30 items, render 30 particles.
                const angle = i * 0.8;
                const radius = 4 + (i * 0.2);
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const yOffset = (i * 0.3); // Stack slightly

                return (
                    <mesh key={i} position={[x, yOffset, z]}>
                        <sphereGeometry args={[0.8, 16, 16]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={0.6}
                            roughness={0.2}
                            metalness={0.5}
                        />
                    </mesh>
                );
            })}
        </group>
    );
};

// --- MAIN MESH PROCESSING ---
const ProcessedScene: React.FC<{ heatmapData: HeatmapData[] }> = ({ heatmapData }) => {
    // 2. Parse the OBJ Synchronously (Avoids async Suspense issues)
    const { nodes, particles } = useMemo(() => {
        if (!OBJ_RAW_TEXT || OBJ_RAW_TEXT.length < 100) return { nodes: [], particles: [] };

        try {
            const loader = new OBJLoader();
            const obj = loader.parse(OBJ_RAW_TEXT);

            const processedNodes: React.ReactNode[] = [];
            const particleData: { location: string; position: THREE.Vector3; moods: string[] }[] = [];

            obj.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    // Fuzzy Matching: "Group_AQ1_Instance" includes "AQ1"
                    const buildingName = BUILDING_LIST.find(name => child.name.includes(name));
                    let materialColor = new THREE.Color('#e2e8f0'); // Default Slate

                    // Visual Logic
                    if (buildingName) {
                        const data = findDataForBuilding(buildingName, heatmapData);
                        const risk = data?.riskScore || 0; // 0 if no data
                        const moods = data?.recentMoods || [];

                        // 1. Color Interpolation
                        materialColor = getRiskColor(risk);

                        // 2. Particle Positioning
                        if (moods.length > 0) {
                            child.geometry.computeBoundingBox();
                            const center = new THREE.Vector3();
                            child.geometry.boundingBox!.getCenter(center);

                            // Add to particle systems list
                            particleData.push({
                                location: buildingName,
                                position: center, // Local center relative to mesh
                                moods: moods
                            });
                        }
                    }

                    // Clone geometry/material to apply unique colors
                    processedNodes.push(
                        <mesh
                            key={child.uuid}
                            geometry={child.geometry}
                            castShadow
                            receiveShadow
                        >
                            <meshStandardMaterial
                                color={materialColor}
                                roughness={0.4}
                                metalness={0.1}
                                side={THREE.FrontSide} // Fix artifacts
                                shadowSide={THREE.FrontSide} // Fix artifacts
                                polygonOffset
                                polygonOffsetFactor={1}
                                flatShading={false}
                            />
                        </mesh>
                    );
                }
            });

            return { nodes: processedNodes, particles: particleData };
        } catch (e) {
            console.error("OBJ Parse Error:", e);
            return { nodes: [], particles: [] };
        }
    }, [heatmapData]);

    if (nodes.length === 0) return <Html center><div className="text-red-500 font-bold">模型解析失败</div></Html>;

    return (
        <group>
            {nodes}
            {particles.map((p, i) => (
                <ParticleSystem key={i} position={p.position} moods={p.moods} />
            ))}
        </group>
    );
};

// --- VIEW COMPONENTS ---
const View3D: React.FC = () => {
    return (
        <>
            <PerspectiveCamera makeDefault position={[60, 60, 60]} fov={50} />
            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.05}
                maxPolarAngle={Math.PI / 2}
            />
        </>
    );
};

const View2D: React.FC = () => {
    return (
        <>
            <OrthographicCamera makeDefault position={[0, 100, 0]} zoom={15} />
            <OrbitControls
                makeDefault
                enableRotate={false}
                enableZoom={true}
                enablePan={true}
            />
        </>
    );
};

// --- MAIN COMPONENT ---
export const SchoolModel: React.FC<SchoolModelProps> = ({ viewMode, heatmapData }) => {
    return (
        <>
            <ambientLight intensity={0.7} />
            <directionalLight
                position={[100, 200, 100]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0001}
            />

            <Center>
                <React.Suspense fallback={<Html center><span className="text-slate-500 font-bold loading-text">加载校园模型中...</span></Html>}>
                    <ProcessedScene heatmapData={heatmapData} />
                </React.Suspense>
            </Center>

            {/* View Switching Logic */}
            {viewMode === '3D' ? <View3D /> : <View2D />}
        </>
    );
};
