import assert from 'node:assert/strict';
import { generateUsername, generateUsernameBatch } from '../src/generator.js';
import { loadConfig } from '../src/config.js';
import { UsernameStorage } from '../src/storage.js';
import { checkUsernameBatch, validateRegistration } from '../src/checker.js';
import fs from 'node:fs';
import path from 'node:path';

async function runTests() {
  console.log('[TEST] Starting test suite...\n');

  // Test 1: Generator bounds and constraints
  console.log('1. Testing username generator rules...');
  for (let i = 0; i < 500; i++) {
    const min = 4;
    const max = 7;
    const name = generateUsername({
      minLength: min,
      maxLength: max,
      allowNumbers: true,
      allowUnderscores: true,
    });

    assert.ok(name.length >= min && name.length <= max, `Length out of range: ${name.length}`);
    assert.ok(!name.startsWith('_'), `Username starts with underscore: ${name}`);
    assert.ok(!name.endsWith('_'), `Username ends with underscore: ${name}`);
    const underscoreCount = (name.match(/_/g) || []).length;
    assert.ok(underscoreCount <= 1, `Multiple underscores generated: ${name}`);
    assert.ok(/^[a-zA-Z0-9_]+$/.test(name), `Invalid characters generated: ${name}`);
  }

  // Test 2: Generator without numbers or underscores
  console.log('2. Testing generator without numbers/underscores...');
  for (let i = 0; i < 100; i++) {
    const name = generateUsername({
      minLength: 5,
      maxLength: 5,
      allowNumbers: false,
      allowUnderscores: false,
    });
    assert.equal(name.length, 5);
    assert.ok(/^[a-zA-Z]+$/.test(name), `Found non-letter: ${name}`);
  }

  // Test 3: Generator batch
  console.log('3. Testing batch generation uniqueness...');
  const batch = generateUsernameBatch(30, {
    minLength: 5,
    maxLength: 6,
    allowNumbers: true,
    allowUnderscores: true,
  });
  assert.equal(batch.length, 30);
  const set = new Set(batch.map((n) => n.toLowerCase()));
  assert.equal(set.size, 30, 'Duplicate names generated in batch');

  // Test 4: Storage in timestamped folder
  console.log('4. Testing Unix timestamp folder storage...');
  const testDir = path.resolve(process.cwd(), 'temp_test_results');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  const customTimestamp = 1700000000;
  const storage = new UsernameStorage(testDir, customTimestamp);

  assert.equal(storage.getSavedCount(), 0);
  assert.equal(storage.getSessionFileName(), '1700000000.txt');

  const saved1 = await storage.saveUsername('testuser123');
  assert.equal(saved1, true);
  assert.equal(storage.getSavedCount(), 1);

  // Duplicates should be rejected
  const saved2 = await storage.saveUsername('testuser123');
  assert.equal(saved2, false);
  const saved3 = await storage.saveUsername('TESTUSER123');
  assert.equal(saved3, false);
  assert.equal(storage.getSavedCount(), 1);

  // Verify file was written
  const files = storage.listSavedFiles();
  assert.equal(files.length, 1);
  assert.equal(files[0].name, '1700000000.txt');
  assert.equal(files[0].count, 1);

  const content = storage.getFileContent('1700000000.txt');
  assert.deepEqual(content, ['testuser123']);

  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // Test 5: Config loader
  console.log('5. Testing config defaults and clamps...');
  const config = loadConfig('non_existent_config.json');
  assert.ok(config.minLength >= 3);
  assert.ok(config.maxLength <= 20);
  assert.ok(config.batchSize > 0);
  assert.equal(config.outputDir, 'results');

  // Test 6: RoZod API Integration
  console.log('6. Testing RoZod API with known usernames (builderman, roblox)...');
  const checkResult = await checkUsernameBatch(['roblox', 'builderman']);
  assert.equal(checkResult.rateLimited, false, 'Was rate limited during test');
  assert.ok(checkResult.taken.includes('roblox'), 'roblox was not recognized as taken');
  assert.ok(checkResult.taken.includes('builderman'), 'builderman was not recognized as taken');
  assert.equal(checkResult.unclaimed.length, 0);

  // Test 7: RoZod Registration Validation
  console.log('7. Testing RoZod validateRegistration on taken username...');
  const validation = await validateRegistration('builderman');
  assert.equal(validation.isValid, false, 'builderman should not be valid for registration');

  console.log('\n[PASS] All 7 tests passed successfully!\n');
}

runTests().catch((err) => {
  console.error('\n[FAIL] Test failed:', err);
  process.exit(1);
});
