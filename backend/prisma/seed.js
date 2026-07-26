import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const templateCategories = [
    { name: 'Modern', slug: 'modern', category: 'Modern', tags: ['modern', 'clean', 'contemporary'] },
    { name: 'Classic', slug: 'classic', category: 'Classic', tags: ['classic', 'traditional', 'timeless'] },
    { name: 'Corporate', slug: 'corporate', category: 'Corporate', tags: ['corporate', 'business', 'formal'] },
    { name: 'Minimal', slug: 'minimal', category: 'Minimal', tags: ['minimal', 'simple', 'clean'] },
    { name: 'Creative', slug: 'creative', category: 'Creative', tags: ['creative', 'design', 'artistic'] },
    { name: 'Professional', slug: 'professional', category: 'Professional', tags: ['professional', 'polished'] },
    { name: 'Elegant', slug: 'elegant', category: 'Elegant', tags: ['elegant', 'sophisticated', 'refined'] },
    { name: 'Executive', slug: 'executive', category: 'Executive', tags: ['executive', 'senior', 'leadership'] },
    { name: 'Academic', slug: 'academic', category: 'Academic', tags: ['academic', 'research', 'education'] },
    { name: 'Student', slug: 'student', category: 'Student', tags: ['student', 'entry-level', 'graduate'] },
    { name: 'Developer', slug: 'developer', category: 'Developer', tags: ['developer', 'tech', 'programming'] },
    { name: 'Engineer', slug: 'engineer', category: 'Engineer', tags: ['engineer', 'technical', 'STEM'] },
    { name: 'Designer', slug: 'designer', category: 'Designer', tags: ['designer', 'portfolio', 'visual'] },
    { name: 'Business', slug: 'business', category: 'Business', tags: ['business', 'MBA', 'management'] },
    { name: 'Medical', slug: 'medical', category: 'Medical', tags: ['medical', 'healthcare', 'clinical'] },
    { name: 'Legal', slug: 'legal', category: 'Legal', tags: ['legal', 'law', 'attorney'] },
    { name: 'Marketing', slug: 'marketing', category: 'Marketing', tags: ['marketing', 'digital', 'brand'] },
    { name: 'Finance', slug: 'finance', category: 'Finance', tags: ['finance', 'banking', 'accounting'] },
    { name: 'ATS Friendly', slug: 'ats-friendly', category: 'ATS Friendly', tags: ['ats', 'applicant-tracking', 'optimized'] },
    { name: 'European', slug: 'european', category: 'European', tags: ['european', 'CV', 'international'] },
    { name: 'Harvard', slug: 'harvard', category: 'Harvard', tags: ['harvard', 'academic', 'ivy-league'] },
    { name: 'Simple', slug: 'simple', category: 'Simple', tags: ['simple', 'basic', 'straightforward'] },
    { name: 'Blue', slug: 'blue', category: 'Blue', tags: ['blue', 'color', 'professional'] },
    { name: 'Black', slug: 'black', category: 'Black', tags: ['black', 'monochrome', 'bold'] },
    { name: 'Premium', slug: 'premium', category: 'Premium', tags: ['premium', 'luxury', 'exclusive'], isPremium: true },
    { name: 'Tech Startup', slug: 'tech-startup', category: 'Modern', tags: ['startup', 'tech', 'innovative'] },
    { name: 'Consultant', slug: 'consultant', category: 'Professional', tags: ['consultant', 'advisory', 'strategy'] },
];
const defaultTheme = {
    primaryColor: '#6366f1',
    accentColor: '#8b5cf6',
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 1.5,
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    spacing: 16,
    headerStyle: 'centered',
    sectionStyle: 'underline',
    showPhoto: true,
    showIcons: true,
};
const colorVariants = {
    blue: { primaryColor: '#2563eb', accentColor: '#3b82f6' },
    black: { primaryColor: '#1f2937', accentColor: '#374151' },
    elegant: { primaryColor: '#7c3aed', accentColor: '#a78bfa', fontFamily: 'Playfair Display' },
    creative: { primaryColor: '#ec4899', accentColor: '#f472b6', headerStyle: 'sidebar' },
    corporate: { primaryColor: '#0f766e', accentColor: '#14b8a6', showPhoto: false },
    minimal: { primaryColor: '#374151', accentColor: '#6b7280', showIcons: false, sectionStyle: 'minimal' },
    executive: { primaryColor: '#1e3a5f', accentColor: '#2563eb', fontFamily: 'Georgia' },
    developer: { primaryColor: '#059669', accentColor: '#10b981', headerStyle: 'sidebar' },
};
async function main() {
    console.log('🌱 Seeding database...');
    for (const tmpl of templateCategories) {
        const themeOverride = colorVariants[tmpl.slug] || {};
        const isPremium = 'isPremium' in tmpl ? tmpl.isPremium : false;
        await prisma.template.upsert({
            where: { slug: tmpl.slug },
            update: {},
            create: {
                name: tmpl.name,
                slug: tmpl.slug,
                description: `Professional ${tmpl.name.toLowerCase()} resume template - ATS optimized and recruiter approved.`,
                category: tmpl.category,
                tags: tmpl.tags,
                isPremium: isPremium || false,
                thumbnail: `/templates/${tmpl.slug}.png`,
                previewImages: [`/templates/${tmpl.slug}-preview.png`],
                defaultTheme: { ...defaultTheme, ...themeOverride },
                layout: {
                    type: themeOverride.headerStyle === 'sidebar' ? 'sidebar' : 'standard',
                    columns: 1,
                    sections: ['personalInfo', 'summary', 'experience', 'education', 'skills'],
                },
                popularity: Math.floor(Math.random() * 1000),
            },
        });
    }
    console.log(`✅ Seeded ${templateCategories.length} templates`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map