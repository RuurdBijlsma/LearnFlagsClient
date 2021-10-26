export interface EncounterResult {
    rollingAccuracy: number,
    accuracy: number,
    correct: boolean,
    countryCode: string,
    userAnswer: string,
    responseTime: number
}

export interface TestResult {
    duration: number,
    history: EncounterResult[],
    encounteredFlags: Set<string>,
}

export interface ModelStat {
    key: string,
    activation: number,
    rof: number,
}
