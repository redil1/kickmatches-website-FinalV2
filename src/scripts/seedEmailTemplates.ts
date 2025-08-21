#!/usr/bin/env npx tsx

/**
 * Email Templates Seeding Script
 * Populates the email_templates table with professional IPTV SMARTERS PRO templates
 */

import { db } from '../db/client';
import { sql } from 'drizzle-orm';
import { emailTemplates } from '../data/emailTemplates';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Main seeding function
 */
async function seedEmailTemplates() {
  console.log('🌱 Starting email templates seeding...');
  
  try {
    // Check if templates already exist
    const existingTemplates = await db.execute(
      sql`SELECT COUNT(*) as count FROM email_templates`
    );
    
    const count = (existingTemplates as any).rows?.[0]?.count || 0;
    
    if (count > 0) {
      console.log(`📋 Found ${count} existing templates. Updating them...`);
      await updateExistingTemplates();
    } else {
      console.log('📝 No existing templates found. Creating new ones...');
      await insertNewTemplates();
    }
    
    // Verify seeding
    await verifySeeding();
    
    console.log('✅ Email templates seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    process.exit(1);
  }
}

/**
 * Insert new templates
 */
async function insertNewTemplates() {
  const templates = prepareTemplateData();
  
  for (const template of templates) {
    try {
      await db.execute(sql`
        INSERT INTO email_templates (
          id, name, subject, html_content, text_content, 
          variables, created_at, updated_at
        ) VALUES (
          ${template.id},
          ${template.name},
          ${template.subject},
          ${template.html_content},
          ${template.text_content},
          ${JSON.stringify({})},
          NOW(),
          NOW()
        )
      `);
      
      console.log(`✅ Created template: ${template.name}`);
      
    } catch (error) {
      console.error(`❌ Error creating template ${template.name}:`, error);
      throw error;
    }
  }
}

/**
 * Update existing templates
 */
async function updateExistingTemplates() {
  const templates = prepareTemplateData();
  
  for (const template of templates) {
    try {
      // Check if template exists
      const existing = await db.execute(
        sql`SELECT id FROM email_templates WHERE id = ${template.id}`
      );
      
      if ((existing as any).rows?.length > 0) {
        // Update existing template
        await db.execute(sql`
          UPDATE email_templates SET
            name = ${template.name},
            subject = ${template.subject},
            html_content = ${template.html_content},
            text_content = ${template.text_content},
            variables = ${JSON.stringify({})},
            updated_at = NOW()
          WHERE id = ${template.id}
        `);
        
        console.log(`🔄 Updated template: ${template.name}`);
      } else {
        // Insert new template
        await db.execute(sql`
          INSERT INTO email_templates (
            id, name, subject, html_content, text_content, 
            variables, created_at, updated_at
          ) VALUES (
            ${template.id},
            ${template.name},
            ${template.subject},
            ${template.html_content},
            ${template.text_content},
            ${JSON.stringify({})},
            NOW(),
            NOW()
          )
        `);
        
        console.log(`✅ Created new template: ${template.name}`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating template ${template.name}:`, error);
      throw error;
    }
  }
}

/**
 * Prepare template data for database insertion
 */
function prepareTemplateData(): EmailTemplate[] {
  const templates: EmailTemplate[] = [];
  
  // Process each template from emailTemplates
  Object.entries(emailTemplates).forEach(([key, template]) => {
    templates.push({
      id: key,
      name: template.name,
      subject: template.subject,
      html_content: template.htmlTemplate,
      text_content: template.textTemplate
    });
  });
  
  return templates;
}

// Template type function removed as it's no longer needed

/**
 * Verify seeding was successful
 */
async function verifySeeding() {
  try {
    const result = await db.execute(
      sql`
        SELECT 
          id, name,
          LENGTH(html_content) as html_length,
          LENGTH(text_content) as text_length,
          created_at, updated_at
        FROM email_templates 
        ORDER BY name
      `
    );
    
    const templates = (result as any).rows || [];
    
    console.log('\n📊 Email Templates Summary:');
    console.log('=' .repeat(80));
    console.log('ID'.padEnd(20) + 'Name'.padEnd(25) + 'HTML Size');
    console.log('-'.repeat(80));
    
    templates.forEach((template: any) => {
      console.log(
        template.id.padEnd(20) +
        template.name.substring(0, 24).padEnd(25) +
        `${template.html_length} chars`
      );
    });
    
    console.log('-'.repeat(80));
    console.log(`Total templates: ${templates.length}`);
    
    // Verify all expected templates exist
    const expectedTemplates = Object.keys(emailTemplates);
    const existingTemplateIds = templates.map((t: any) => t.id);
    const missingTemplates = expectedTemplates.filter(id => !existingTemplateIds.includes(id));
    
    if (missingTemplates.length > 0) {
      console.warn(`⚠️  Missing templates: ${missingTemplates.join(', ')}`);
    } else {
      console.log('✅ All expected templates are present');
    }
    
  } catch (error) {
    console.error('❌ Error verifying seeding:', error);
    throw error;
  }
}

/**
 * Clean up function to remove all email templates (for testing)
 */
export async function cleanEmailTemplates() {
  console.log('🧹 Cleaning up email templates...');
  
  try {
    await db.execute(sql`DELETE FROM email_templates`);
    console.log('✅ All email templates removed');
  } catch (error) {
    console.error('❌ Error cleaning email templates:', error);
    throw error;
  }
}

/**
 * Export functions for use in other scripts
 */
export { seedEmailTemplates, verifySeeding };

// Run seeding if this script is executed directly
if (require.main === module) {
  seedEmailTemplates()
    .then(() => {
      console.log('\n🎉 Email templates seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error);
      process.exit(1);
    });
}

/**
 * Usage Examples:
 * 
 * # Seed templates
 * npx tsx src/scripts/seedEmailTemplates.ts
 * 
 * # Or use in code
 * import { seedEmailTemplates } from './src/scripts/seedEmailTemplates';
 * await seedEmailTemplates();
 * 
 * # Clean templates (for testing)
 * import { cleanEmailTemplates } from './src/scripts/seedEmailTemplates';
 * await cleanEmailTemplates();
 */