// Script to sync ASSIGNMENT.md to Supabase
// Run: node sync-content.js

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://rsmrvrtxxittloukngge.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzbXJ2cnR4eGl0dGxvdWtuZ2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTkyMjksImV4cCI6MjA4NTM5NTIyOX0.1AuQRcWFX6lPMXCbStbi6n6SciYVEsp1sxZWbpCQzk4';

async function syncMarkdown() {
  try {
    // Read the markdown file
    const mdPath = path.join(__dirname, 'ASSIGNMENT.md');
    const markdown = fs.readFileSync(mdPath, 'utf8');

    console.log('Read ASSIGNMENT.md (' + markdown.length + ' characters)');

    // Upsert to Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/content?id=eq.assignment`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          markdown: markdown,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      // Try INSERT if PATCH fails (row doesn't exist)
      const insertResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/content`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            id: 'assignment',
            markdown: markdown,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!insertResponse.ok) {
        throw new Error('Failed to sync: ' + await insertResponse.text());
      }
    }

    console.log('Successfully synced ASSIGNMENT.md to Supabase!');
  } catch (error) {
    console.error('Error syncing:', error.message);
    process.exit(1);
  }
}

syncMarkdown();
