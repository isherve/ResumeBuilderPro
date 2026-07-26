import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Sparkles, Shield, Download, Palette, Zap,
  Star, Check, ChevronDown, ArrowRight, Users, Award, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const features = [
  { icon: Sparkles, title: 'AI-Powered Writing', description: 'Generate summaries, improve bullet points, and optimize for ATS with AI assistance.' },
  { icon: Shield, title: 'ATS-Friendly', description: 'Templates designed to pass Applicant Tracking Systems with high compatibility scores.' },
  { icon: Palette, title: '25+ Templates', description: 'Professional templates for every industry — from corporate to creative.' },
  { icon: Download, title: 'Multi-Format Export', description: 'Export to PDF, DOCX, TXT, JSON, or share via link with QR codes.' },
  { icon: Target, title: 'Job Matching', description: 'Paste job descriptions and get match percentages with keyword suggestions.' },
  { icon: Zap, title: 'Real-Time Preview', description: 'See changes instantly with live preview, zoom, and fullscreen modes.' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Software Engineer', content: 'Landed 3 interviews in 2 weeks after using ResumeBuilder Pro. The ATS score feature is a game changer.', rating: 5 },
  { name: 'Marcus Johnson', role: 'Marketing Manager', content: 'The AI bullet point generator saved me hours. My resume looks incredibly professional now.', rating: 5 },
  { name: 'Emily Rodriguez', role: 'Recent Graduate', content: 'As a new grad, the student templates and AI suggestions helped me create a standout resume.', rating: 5 },
];

const pricingPlans = [
  { name: 'Free', price: '$0', period: 'forever', features: ['3 resumes', 'Basic templates', 'PDF export', '5 AI credits/month'], cta: 'Get Started', popular: false },
  { name: 'Premium', price: '$9.99', period: '/month', features: ['Unlimited resumes', 'All templates', 'All export formats', 'Unlimited AI', 'ATS checker', 'Priority support'], cta: 'Start Free Trial', popular: true },
  { name: 'Enterprise', price: '$29.99', period: '/month', features: ['Everything in Premium', 'Team collaboration', 'Custom branding', 'API access', 'Dedicated support', 'Analytics dashboard'], cta: 'Contact Sales', popular: false },
];

const faqs = [
  { q: 'Are the resumes ATS-friendly?', a: 'Yes! All our templates are designed with ATS compatibility in mind. Our built-in ATS checker analyzes your resume and provides optimization suggestions.' },
  { q: 'Can I import my existing resume?', a: 'Absolutely. You can import from PDF, Word, JSON, or LinkedIn to get started quickly.' },
  { q: 'How does the AI feature work?', a: 'Our AI powered by OpenAI helps generate professional summaries, improve bullet points, suggest skills, and optimize your resume for specific job descriptions.' },
  { q: 'Can I cancel my subscription anytime?', a: 'Yes, you can cancel your Premium subscription at any time. You will retain access until the end of your billing period.' },
];

export function LandingPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="h-3 w-3 mr-1" /> Trusted by 50,000+ professionals
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-balance max-w-4xl mx-auto">
              Create Professional{' '}
              <span className="gradient-text">ATS-Friendly Resumes</span>{' '}
              in Minutes
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Build beautiful resumes that impress recruiters. AI-powered, ATS-optimized, and designed for success.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" asChild>
                <Link to="/register">
                  Create Resume <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/templates">Browse Templates</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 relative"
          >
            <div className="glass rounded-2xl p-2 shadow-2xl max-w-4xl mx-auto">
              <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-8 sm:p-12 border">
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  {[Users, Award, Target].map((Icon, i) => (
                    <div key={i} className="glass rounded-lg p-4 text-center">
                      <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{['50K+', '95%', '3x'][i]}</p>
                      <p className="text-xs text-muted-foreground">{['Users', 'ATS Pass Rate', 'More Interviews'][i]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything You Need to Land Your Dream Job</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to help you create, optimize, and export professional resumes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className="h-full glass hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-2">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Loved by Job Seekers Worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">&ldquo;{t.content}&rdquo;</p>
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-muted-foreground mb-16">Start free, upgrade when you need more power.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}
                <CardHeader className="text-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
                    <Link to="/register">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group glass rounded-xl">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-medium list-none">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6 text-muted-foreground">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="glass rounded-2xl p-12 gradient-primary/10">
            <FileText className="h-12 w-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Ready to Build Your Perfect Resume?</h2>
            <p className="text-muted-foreground mb-8">Join thousands of professionals who landed their dream jobs.</p>
            <Button size="xl" asChild>
              <Link to="/register">Get Started Free <ArrowRight className="h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">ResumeBuilder Pro</span>
              </div>
              <p className="text-sm text-muted-foreground">Create professional resumes that get you hired.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Templates', 'Pricing', 'AI Tools'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ResumeBuilder Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
