export function calculateCompoundInterest(principalAmount:number , interestRate: number ,
    compoundFreq:number , numberOfCompound:number ){
        return principalAmount * ((1+ interestRate/compoundFreq) ** (numberOfCompound))
    }
