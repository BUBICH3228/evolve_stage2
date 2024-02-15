/* eslint-disable @typescript-eslint/no-explicit-any */

interface PseudoRandomPercentageObject {
    __currentPercentage: number;
    __weight: number;
    __basePercentage: number;
}

/**
 * Rolls a number from 1 to 100 and returns true if the roll is less than or equal
 * to the number specified.
 */
declare function RollPercentage(this: void, successPercentage: number): boolean;

(globalThis as any).RollPercentage = function (this: void, successPercentage: number): boolean {
    const roll = RandomFloat(0, 100);
    return roll < successPercentage || math.abs(roll - successPercentage) < 0.01;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function RollPseudoRandomPercentage(
    this: void,
    successPercentage: number,
    object: CDOTA_BaseNPC | CDOTABaseAbility | CDOTA_Buff
): boolean;

(globalThis as any).RollPseudoRandomPercentage = function (
    this: void,
    successPercentage: number,
    object: CDOTA_BaseNPC | CDOTABaseAbility | CDOTA_Buff
): boolean {
    if (successPercentage > 100 || math.abs(successPercentage - 100) < 0.01) {
        return true;
    }

    if (successPercentage > 0) {
        const convertedObject = object as unknown as PseudoRandomPercentageObject;

        if (convertedObject.__currentPercentage != successPercentage) {
            convertedObject.__weight = FindProbabilityWeight(successPercentage);
            convertedObject.__basePercentage = successPercentage;
        }

        convertedObject.__currentPercentage ??= 0;
        const roll = RollPercentage(convertedObject.__currentPercentage);
        convertedObject.__currentPercentage = convertedObject.__currentPercentage + convertedObject.__weight;

        if (roll) {
            convertedObject.__currentPercentage = convertedObject.__weight;
        }

        return roll;
    }

    return false;
};

function FindProbabilityWeight(roll: number) {
    const percent = roll / 100;
    let Cupper = percent;
    let Clower = 0.0;
    let Cmid = 0.0;
    let roll1: number;
    let roll2 = 1.0;
    let check = true;
    let maxDistr = 1000;

    while (check) {
        Cmid = (Cupper + Clower) / 2;
        roll1 = FindRelativeProbability(Cmid);

        if (math.abs(roll1 - roll2) < 0.01) {
            check = false;
            break;
        }

        if (roll1 > percent) {
            Cupper = Cmid;
        } else {
            Clower = Cmid;
        }

        roll2 = roll1;

        maxDistr -= 1;

        if (maxDistr < 0) {
            check = false;
            break;
        }
    }

    return Cmid * 100;
}

function FindRelativeProbability(weight: number | undefined) {
    if (weight == undefined) {
        weight = 1;
    }

    let pProcOnN = 0.0;
    let pProcByN = 0.0;
    let sumNpProcOnN = 0.0;
    const maxFails = math.ceil(1.0 / weight);

    for (let N = 1; N <= maxFails; N++) {
        pProcOnN = math.min(1.0, N * weight) * (1.0 - pProcByN);
        pProcByN = pProcByN + pProcOnN;
        sumNpProcOnN = sumNpProcOnN + N * pProcOnN;
    }

    return 1.0 / sumNpProcOnN;
}
