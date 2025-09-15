#!/usr/bin/env node

/**
 * Helper script to get Vercel configuration for GitHub secrets
 * Run this after connecting your project to Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel Configuration Helper\n');

try {
  // Check if .vercel directory exists
  const vercelDir = path.join(__dirname, '.vercel');
  
  if (fs.existsSync(vercelDir)) {
    const projectFile = path.join(vercelDir, 'project.json');
    
    if (fs.existsSync(projectFile)) {
      const projectConfig = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
      
      console.log('✅ Found Vercel project configuration:');
      console.log('');
      console.log('Add these to your GitHub repository secrets:');
      console.log('');
      console.log(`ORG_ID: ${projectConfig.orgId}`);
      console.log(`PROJECT_ID: ${projectConfig.projectId}`);
      console.log('');
      console.log('You still need to add:');
      console.log('- VERCEL_TOKEN (from https://vercel.com/account/tokens)');
      console.log('- NEXT_PUBLIC_API_URL (your Railway backend URL)');
      
    } else {
      console.log('❌ Project not linked to Vercel yet.');
      console.log('');
      console.log('To link your project:');
      console.log('1. Run: vercel --prod');
      console.log('2. Follow the prompts to link/create project');
      console.log('3. Run this script again');
    }
  } else {
    console.log('❌ No Vercel configuration found.');
    console.log('');
    console.log('To get started:');
    console.log('1. Run: vercel login');
    console.log('2. Run: vercel --prod');
    console.log('3. Run this script again');
  }
} catch (error) {
  console.error('Error:', error.message);
}

console.log('');
console.log('📖 For detailed instructions, see: docs/deployment/DEPLOYMENT.md');