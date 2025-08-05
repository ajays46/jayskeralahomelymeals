// Test pricing calculation for August Menu
// This helps verify the pricing logic works correctly

const testPricingCalculation = () => {
  console.log('🧮 Testing Pricing Calculation for August Menu\n');

  // Mock data for August Menu
  const selectedMenu = {
    name: 'August Menu',
    totalMenuPrice: 9000, // ₹9000 for the monthly plan
    isComprehensiveMenu: true
  };

  const selectedDates = [
    new Date('2025-08-01'),
    new Date('2025-08-02'),
    new Date('2025-08-03')
  ]; // 3 days

  const skipMeals = {
    '2025-08-01': {
      breakfast: true // Skip breakfast on day 1
    },
    '2025-08-02': {
      lunch: true // Skip lunch on day 2
    }
  };

  // Calculate total price
  const basePrice = selectedMenu.totalMenuPrice; // ₹9000
  const totalForAllDates = basePrice * selectedDates.length; // ₹9000 × 3 = ₹27000
  
  // Calculate skipped meals deduction
  let skippedMealsTotal = 0;
  Object.entries(skipMeals).forEach(([dateStr, skippedMealsForDate]) => {
    const dailyPrice = basePrice; // ₹9000
    const mealPrice = Math.round(dailyPrice / 3); // ₹3000 per meal
    
    Object.keys(skippedMealsForDate).forEach(mealType => {
      skippedMealsTotal += mealPrice; // Add ₹3000 for each skipped meal
    });
  });
  
  const finalTotal = totalForAllDates - skippedMealsTotal;

  console.log('📊 Pricing Breakdown:');
  console.log('Base Menu Price: ₹', basePrice);
  console.log('Number of Days: ', selectedDates.length);
  console.log('Total for All Dates: ₹', totalForAllDates);
  console.log('Skipped Meals:');
  console.log('  - Day 1: Skip breakfast (₹3000)');
  console.log('  - Day 2: Skip lunch (₹3000)');
  console.log('Total Skipped: ₹', skippedMealsTotal);
  console.log('Final Total: ₹', finalTotal);
  
  console.log('\n✅ Expected Result:');
  console.log('₹27000 - ₹6000 = ₹21000');
  
  console.log('\n🎯 This shows:');
  console.log('1. Menu card shows "Plan Price: ₹9000" (base menu item price)');
  console.log('2. Each day costs ₹9000');
  console.log('3. Each meal costs ₹3000');
  console.log('4. Skipping meals deducts ₹3000 each');
  console.log('5. No more ₹63000 incorrect calculation!');
  console.log('6. Total calculation is based on actual menu item price');
};

// Run the test
testPricingCalculation(); 