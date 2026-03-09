/**
 * Quick test script to verify backend API connection
 * Run this with: node test-api-connection.js
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function testAPIConnection() {
  console.log("🧪 Testing AgriSense Backend API Connection\n");
  console.log(`📡 API URL: ${API_BASE_URL}\n`);

  try {
    // Test 1: Health Check
    console.log("1️⃣ Testing Health Endpoint...");
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log("   ✓ Health check passed");
    console.log(`   - Status: ${healthData.status}`);
    console.log(`   - Model loaded: ${healthData.model_loaded}`);
    console.log(`   - Number of classes: ${healthData.num_classes}\n`);

    // Test 2: Get Classes
    console.log("2️⃣ Testing Classes Endpoint...");
    const classesResponse = await fetch(`${API_BASE_URL}/classes`);
    
    if (!classesResponse.ok) {
      throw new Error(`Classes request failed: ${classesResponse.status}`);
    }
    
    const classesData = await classesResponse.json();
    console.log("   ✓ Classes retrieved successfully");
    console.log(`   - Number of classes: ${classesData.num_classes}`);
    console.log(`   - Sample classes: ${classesData.classes.slice(0, 3).join(", ")}...\n`);

    // Test 3: Root Endpoint
    console.log("3️⃣ Testing Root Endpoint...");
    const rootResponse = await fetch(`${API_BASE_URL}/`);
    
    if (!rootResponse.ok) {
      throw new Error(`Root request failed: ${rootResponse.status}`);
    }
    
    const rootData = await rootResponse.json();
    console.log("   ✓ Root endpoint accessible");
    console.log(`   - Message: ${rootData.message}`);
    console.log(`   - Version: ${rootData.version}\n`);

    console.log("✅ All API tests passed! Backend is ready.\n");
    console.log("📝 Next steps:");
    console.log("   1. Start frontend: cd frontend && npm run dev");
    console.log("   2. Visit: http://localhost:3000/disease-detection");
    console.log("   3. Upload a plant leaf image to test disease detection\n");

  } catch (error) {
    console.error("\n❌ API Connection Test Failed\n");
    console.error(`Error: ${error.message}\n`);
    console.error("🔧 Troubleshooting:");
    console.error("   1. Ensure backend is running: cd plant_disease_detection/api && python app.py");
    console.error("   2. Check backend is accessible at:", API_BASE_URL);
    console.error("   3. Verify no firewall is blocking port 8000");
    console.error("   4. Check backend console for errors\n");
    process.exit(1);
  }
}

testAPIConnection();
