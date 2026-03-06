const fs = require('fs');
const path = require('path');
const earcut = require('earcut');

const filePath = path.join(__dirname, '../components/SchoolModelData.ts');

console.log("Reading file:", filePath);
let content = fs.readFileSync(filePath, 'utf8');

// Extract OBJ Content between backticks
const startMarker = "export const OBJ_RAW_TEXT = `";
const endMarker = "`;";
const startIndex = content.indexOf(startMarker);
const endIndex = content.lastIndexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find OBJ template buffer.");
    process.exit(1);
}

const objContent = content.substring(startIndex + startMarker.length, endIndex);
const lines = objContent.split('\n');
const vertices = [];

// 1. Parse Vertices
console.log("Parsing vertices...");
lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('v ')) {
        const parts = trimmed.split(/\s+/);
        vertices.push({
            x: parseFloat(parts[1]),
            y: parseFloat(parts[2]),
            z: parseFloat(parts[3])
        });
    }
});

console.log(`Found ${vertices.length} vertices.`);

// 2. Process Faces
let triangulatedCount = 0;
const newLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('f ')) {
        const parts = trimmed.split(/\s+/);
        // parts[0] is 'f'
        const faceDefinitions = parts.slice(1);

        // If polygon has > 4 vertices (Complex N-gon), triangulate. 
        // Quads (4) are handled fine by standard loaders usually, and usually used for walls (which might be vertical and fail XZ projection).
        if (faceDefinitions.length > 4) {
            triangulatedCount++;
            // Parse vertex indices (1-based)
            const indices = faceDefinitions.map(def => parseInt(def.split('/')[0]) - 1);

            // Build Flat Coordinate Array [x, y, x, y...] (using X and Z for 2D plane projection)
            // Note: Roofing is usually XZ plane. Vertical walls might fail this projection!
            // However, 'Artifacts on Roof' implies horizontal faces.
            // Check Normal? earcut assumes 2D. 
            // Better: Project to dominant axis?
            // For now, assume Roofs (XZ).

            const flattened = [];
            indices.forEach(idx => {
                const v = vertices[idx];
                flattened.push(v.x, v.z);
            });

            // Earcut
            const triangles = earcut(flattened);

            if (triangles.length === 0) {
                console.warn("Earcut returned 0 triangles for face around line:", line.substring(0, 50));
                return line; // Fallback
            }

            // Reconstruct triangles
            const newFaces = [];
            for (let i = 0; i < triangles.length; i += 3) {
                const a = faceDefinitions[triangles[i]];
                const b = faceDefinitions[triangles[i + 1]];
                const c = faceDefinitions[triangles[i + 2]];
                newFaces.push(`f ${a} ${b} ${c}`);
            }
            return newFaces.join('\n');
        }
    }
    return line;
});

// 3. Write Back
console.log(`Triangulated ${triangulatedCount} faces.`);
const newObjContent = newLines.join('\n');
const newFileContent = content.substring(0, startIndex + startMarker.length) +
    newObjContent +
    content.substring(endIndex);

fs.writeFileSync(filePath, newFileContent);
console.log("Done.");
