'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SimpleSupabaseTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runSimpleTest = async () => {
    setIsLoading(true);
    setTestResult('Testing...');

    try {
      console.log('=== SIMPLE SUPABASE TEST ===');
      
      // Check if supabase client is initialized
      console.log('Supabase client:', supabase);
      
      // Test 1: Check environment variables
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setTestResult('❌ Environment variables missing');
        return;
      }

      // Test 2: Simple query
      console.log('Testing simple query...');
      const { data, error } = await supabase
        .from('trials')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Query error:', error);
        setTestResult(`❌ Query failed: ${error.message}`);
        return;
      }

      console.log('Query result:', data);
      setTestResult(`✅ Connection successful! Found ${data?.length || 0} trials`);

    } catch (error) {
      console.error('Test error:', error);
      setTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">Supabase Connection Test</h2>
      <button
        onClick={runSimpleTest}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Run Simple Test'}
      </button>
      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <pre className="text-sm">{testResult}</pre>
        </div>
      )}
    </div>
  );
}