'use client';

import { useState } from 'react';
import { storage } from '@/lib/storage';
import { DocumentFile } from '@/lib/types';
import { Zap } from 'lucide-react';

interface DemoLoaderProps {
  onLoadComplete?: () => void;
}

export function DemoLoader({ onLoadComplete }: DemoLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const loadDemoData = () => {
    setIsLoading(true);

    const demoDocuments: Omit<DocumentFile, 'id'>[] = [
      {
        name: 'Product Roadmap 2024.txt',
        content: `Product Roadmap 2024

Q1: Foundation
- Launch core platform features
- Implement user authentication
- Set up database infrastructure
- Initial API development

Q2: Growth
- Mobile app development begins
- Advanced search capabilities
- Analytics dashboard launch
- Integration partnerships

Q3: Scale
- Performance optimization
- Machine learning features
- Enterprise features
- Third-party integrations

Q4: Innovation
- AI-powered recommendations
- Advanced analytics
- Compliance certifications
- Premium features launch`,
        uploadedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        size: 1024,
        type: 'text/plain',
      },
      {
        name: 'Meeting Minutes.txt',
        content: `Meeting Minutes - February 19, 2024

Attendees: Sarah, Mike, Jennifer, Alex

Topics Discussed:
1. Project Status Update
   - Current milestone on track
   - Budget allocation approved
   - Timeline adjusted by 2 weeks

2. Technical Discussion
   - Database performance improved by 40%
   - New caching strategy implemented
   - API response times reduced

3. Marketing Strategy
   - Social media campaign launching
   - Partnership discussions ongoing
   - Conference presentations scheduled

4. Action Items
   - Sarah: Finalize API documentation
   - Mike: Complete performance testing
   - Jennifer: Marketing materials review
   - Alex: Schedule client meetings

Next Meeting: March 5, 2024`,
        uploadedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        size: 1536,
        type: 'text/plain',
      },
      {
        name: 'Customer Feedback Summary.txt',
        content: `Customer Feedback Summary - February 2024

Overall Satisfaction: 4.7/5

Positive Feedback:
- Easy-to-use interface
- Fast performance and responsiveness
- Excellent customer support
- Regular feature updates
- Good documentation
- Competitive pricing

Areas for Improvement:
- More advanced search filters needed
- Bulk operations support requested
- Mobile app optimization
- Better export options
- Additional integrations desired

Top Feature Requests:
1. AI-powered insights (125 requests)
2. Advanced analytics (98 requests)
3. API access (87 requests)
4. Custom branding (76 requests)
5. Team collaboration tools (65 requests)

Churn Reduction Initiatives:
- Implemented new onboarding flow
- Added premium support tier
- Created user community forum
- Developed better retention email campaigns

Next Steps:
- Address top 5 feature requests
- Improve mobile experience
- Expand integrations
- Enhance documentation`,
        uploadedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        size: 1920,
        type: 'text/plain',
      },
      {
        name: 'Technical Documentation.txt',
        content: `Technical Documentation - System Architecture

System Overview:
Our platform consists of several key components:

1. Frontend Layer
   - React-based user interface
   - Real-time data synchronization
   - Responsive design for all devices
   - Progressive web app capabilities

2. API Layer
   - RESTful API design
   - GraphQL for complex queries
   - Rate limiting and throttling
   - OAuth 2.0 authentication

3. Database Layer
   - PostgreSQL for relational data
   - Redis for caching
   - Elasticsearch for search
   - S3-compatible storage for files

4. Infrastructure
   - Kubernetes orchestration
   - Load balancing
   - CDN for static assets
   - Monitoring and logging

5. Security
   - End-to-end encryption
   - Two-factor authentication
   - Role-based access control
   - Regular security audits

Performance Metrics:
- Average response time: 150ms
- 99.99% uptime SLA
- Handle 10,000 concurrent users
- 1 million+ daily transactions

Development Stack:
- Node.js with Express
- Python for data processing
- Go for performance-critical services
- Docker for containerization

Deployment Process:
- Continuous integration/deployment
- Blue-green deployments
- Automated testing pipeline
- Rollback capability within 1 minute`,
        uploadedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        size: 2048,
        type: 'text/plain',
      },
    ];

    // Add demo documents
    demoDocuments.forEach(doc => {
      const fullDoc: DocumentFile = {
        ...doc,
        id: Math.random().toString(36).substr(2, 9),
      };
      storage.saveDocument(fullDoc);
    });

    // Add demo analytics events
    const demoEvents = [
      { type: 'upload' as const, fileName: 'Product Roadmap 2024.txt', size: 1024 },
      { type: 'search' as const, query: 'Q1 features', resultCount: 1 },
      { type: 'search' as const, query: 'performance optimization', resultCount: 2 },
      { type: 'upload' as const, fileName: 'Meeting Minutes.txt', size: 1536 },
      { type: 'search' as const, query: 'database', resultCount: 3 },
      { type: 'search' as const, query: 'customer feedback', resultCount: 1 },
      { type: 'upload' as const, fileName: 'Customer Feedback Summary.txt', size: 1920 },
      { type: 'search' as const, query: 'feature requests', resultCount: 1 },
      { type: 'upload' as const, fileName: 'Technical Documentation.txt', size: 2048 },
      { type: 'search' as const, query: 'infrastructure', resultCount: 2 },
    ];

    demoEvents.forEach((event, idx) => {
      const baseTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
      storage.logAnalytics({
        type: event.type,
        timestamp: baseTime + (idx * 12 * 60 * 60 * 1000),
        details:
          event.type === 'upload'
            ? { fileName: event.fileName, size: event.size }
            : { query: event.query, resultCount: event.resultCount },
      });
    });

    setIsLoading(false);
    onLoadComplete?.();
  };

  return (
    <button
      onClick={loadDemoData}
      disabled={isLoading}
      className="fixed bottom-4 right-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
    >
      <Zap className="w-4 h-4" />
      {isLoading ? 'Loading...' : 'Load Demo Data'}
    </button>
  );
}
