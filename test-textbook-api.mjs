#!/usr/bin/env node

const apiBase = "http://192.168.1.46:3000";
const studentId = 4; // Марія Іванова

async function test() {
  try {
    // Test: List student textbooks (should be empty initially)
    console.log(`\n📚 Fetching textbooks for student ${studentId}...`);
    const getRes = await fetch(`${apiBase}/api/students/${studentId}/textbooks`);
    console.log(`Response status: ${getRes.status}`);
    console.log(`Response headers:`, Object.fromEntries(getRes.headers.entries()));

    const text = await getRes.text();
    if (text.startsWith("{")) {
      const getResult = JSON.parse(text);
      console.log(`✅ Textbooks:`, getResult.data);
    } else {
      console.error("❌ Response is not JSON:");
      console.error(text.slice(0, 500));
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

void test();
