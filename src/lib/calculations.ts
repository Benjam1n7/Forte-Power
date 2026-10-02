export interface GeneratorEconomics {
  hoursPerDay: number;
  fuelPricePerLiter: number;
  dailyFuelLiters: number;
  dailyFuelCost: number;
  monthlyFuelCost: number;
  monthlyMaintenanceCost: number;
  monthlyTotalGeneratorCost: number;
  annualGeneratorExpense: number;
  kitPrice: number;
  paybackMonths: number;
  co2SavedKgPerMonth: number;
}

export function calculateGeneratorComparison(
  hoursPerDay: number,
  kitPrice: number,
  fuelPricePerLiter: number = 1050
): GeneratorEconomics {
  // Typical 0.9kVA - 1.2kVA "I-pass-my-neighbor" or 2.5kVA small gen burns ~0.75 L/hour on load
  const litersPerHour = 0.75;
  const dailyFuelLiters = hoursPerDay * litersPerHour;
  const dailyFuelCost = dailyFuelLiters * fuelPricePerLiter;
  const monthlyFuelCost = dailyFuelCost * 30;
  
  // Frequent monthly generator maintenance: 20W-50 oil replacement, spark plug, cord repair
  const monthlyMaintenanceCost = 7500;
  const monthlyTotalGeneratorCost = monthlyFuelCost + monthlyMaintenanceCost;
  const annualGeneratorExpense = monthlyTotalGeneratorCost * 12;

  // Payback period in months
  const paybackMonths = monthlyTotalGeneratorCost > 0 
    ? Math.max(0.5, Number((kitPrice / monthlyTotalGeneratorCost).toFixed(1)))
    : 0;

  // CO2 emissions: ~2.31 kg CO2 per liter of gasoline
  const co2SavedKgPerMonth = Math.round(dailyFuelLiters * 30 * 2.31);

  return {
    hoursPerDay,
    fuelPricePerLiter,
    dailyFuelLiters: Number(dailyFuelLiters.toFixed(1)),
    dailyFuelCost: Math.round(dailyFuelCost),
    monthlyFuelCost: Math.round(monthlyFuelCost),
    monthlyMaintenanceCost,
    monthlyTotalGeneratorCost: Math.round(monthlyTotalGeneratorCost),
    annualGeneratorExpense: Math.round(annualGeneratorExpense),
    kitPrice,
    paybackMonths,
    co2SavedKgPerMonth
  };
}
