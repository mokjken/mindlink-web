export const SCHOOL_STRUCTURE = {
    CNC: {
        name: "CNC 部",
        classes: [
            "初一一班", "初一二班", "初一三班",
            "初二一班", "初二二班",
            "初三一班", "初三二班"
        ],
        defaultLocation: "AQ1"
    },
    AA: {
        name: "AA 部",
        classes: [
            "G7SP", "G8TR", "G8AD", "G9TW", "G9RA",
            "S1ALevel", "S1Passion", "S1APower",
            "S2ALevel", "S2APower", "S2APassion",
            "S3ALevel", "S3APower", "S3APassion"
        ],
        // Map specific classes to locations, others default to AQ4
        locationMap: {
            "S2ALevel": "AQ2", "S2APower": "AQ2", "S2APassion": "AQ2",
            "S3ALevel": "AQ2", "S3APower": "AQ2", "S3APassion": "AQ2"
        },
        defaultLocation: "AQ4"
    }
};

export const getTypeLocation = (faculty: string, className: string): string => {
    const f = SCHOOL_STRUCTURE[faculty as keyof typeof SCHOOL_STRUCTURE];
    if (!f) return "AQ1"; // Fallback

    if (faculty === 'AA') {
        // @ts-ignore
        if (f.locationMap && f.locationMap[className]) {
            // @ts-ignore
            return f.locationMap[className];
        }
        return f.defaultLocation;
    }

    return f.defaultLocation;
};

export const FLATTENED_CLASSES = [
    ...SCHOOL_STRUCTURE.CNC.classes,
    ...SCHOOL_STRUCTURE.AA.classes
];
