export interface Example {
  id: string;
  name: string;
  description: string;
  category: 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'journey' | 'gantt' | 'pie' | 'mindmap';
  code: string;
}

export const examples: Example[] = [
  {
    id: 'user-flow',
    name: 'User Authentication Flow',
    description: 'Login and registration process with OAuth',
    category: 'flowchart',
    code: `flowchart TD
    A[🏠 Landing Page] --> B{User Status}
    B -->|New User| C[📝 Registration]
    B -->|Existing| D[🔐 Login]
    C --> E[Email Verification]
    D --> F{Auth Method}
    F -->|Password| G[Validate Credentials]
    F -->|OAuth| H[🌐 Provider Auth]
    E --> I[✅ Account Created]
    G --> J{Valid?}
    H --> J
    J -->|Yes| K[🎉 Dashboard]
    J -->|No| L[❌ Error]
    L --> D
    I --> K
    
    style A fill:#0ea5e9,stroke:#0284c7,color:#fff
    style K fill:#22c55e,stroke:#16a34a,color:#fff
    style L fill:#ef4444,stroke:#dc2626,color:#fff`,
  },
  {
    id: 'api-sequence',
    name: 'REST API Sequence',
    description: 'Client-server API communication pattern',
    category: 'sequence',
    code: `sequenceDiagram
    participant C as 💻 Client
    participant G as 🚪 API Gateway
    participant A as 🔐 Auth Service
    participant S as ⚙️ Service
    participant D as 🗄️ Database
    
    C->>G: POST /api/data
    G->>A: Validate Token
    A-->>G: Token Valid ✅
    G->>S: Forward Request
    S->>D: Query Data
    D-->>S: Return Results
    S-->>G: Response Payload
    G-->>C: 200 OK + Data`,
  },
  {
    id: 'class-diagram',
    name: 'E-commerce Classes',
    description: 'Product and order management system',
    category: 'class',
    code: `classDiagram
    class User {
        +String id
        +String email
        +String name
        +login()
        +logout()
    }
    class Product {
        +String id
        +String name
        +Float price
        +Int stock
        +updateStock()
    }
    class Order {
        +String id
        +Date createdAt
        +String status
        +calculateTotal()
        +process()
    }
    class Cart {
        +addItem()
        +removeItem()
        +checkout()
    }
    
    User "1" --> "*" Order : places
    User "1" --> "1" Cart : has
    Order "*" --> "*" Product : contains
    Cart "*" --> "*" Product : contains`,
  },
  {
    id: 'state-order',
    name: 'Order State Machine',
    description: 'E-commerce order lifecycle states',
    category: 'state',
    code: `stateDiagram-v2
    [*] --> Pending: Order Placed
    Pending --> Processing: Payment Confirmed
    Pending --> Cancelled: Cancel Request
    Processing --> Shipped: Items Packed
    Processing --> Cancelled: Out of Stock
    Shipped --> Delivered: Delivery Complete
    Shipped --> Returned: Return Requested
    Delivered --> Returned: Return Window
    Returned --> Refunded: Return Processed
    Cancelled --> Refunded: Refund Issued
    Refunded --> [*]
    Delivered --> [*]`,
  },
  {
    id: 'er-blog',
    name: 'Blog Database Schema',
    description: 'Content management ER diagram',
    category: 'er',
    code: `erDiagram
    USER ||--o{ POST : writes
    USER ||--o{ COMMENT : makes
    POST ||--o{ COMMENT : has
    POST ||--o{ TAG : tagged
    CATEGORY ||--o{ POST : contains
    
    USER {
        uuid id PK
        string email UK
        string name
        timestamp created_at
    }
    POST {
        uuid id PK
        string title
        text content
        boolean published
        uuid author_id FK
    }
    COMMENT {
        uuid id PK
        text content
        uuid post_id FK
        uuid user_id FK
    }
    TAG {
        uuid id PK
        string name UK
    }
    CATEGORY {
        uuid id PK
        string name
        string slug UK
    }`,
  },
  {
    id: 'user-journey',
    name: 'Shopping Experience',
    description: 'Customer journey through checkout',
    category: 'journey',
    code: `journey
    title Shopping Journey
    section Discovery
      Browse Homepage: 5: Customer
      Search Products: 4: Customer
      View Product Details: 5: Customer
    section Decision
      Compare Prices: 3: Customer
      Read Reviews: 4: Customer
      Add to Cart: 5: Customer
    section Purchase
      View Cart: 4: Customer
      Enter Shipping: 3: Customer
      Payment: 2: Customer
      Confirmation: 5: Customer
    section Post-Purchase
      Track Order: 4: Customer
      Receive Delivery: 5: Customer
      Leave Review: 3: Customer`,
  },
  {
    id: 'project-gantt',
    name: 'Sprint Planning',
    description: 'Agile project timeline',
    category: 'gantt',
    code: `gantt
    title Sprint 12 - Q4 2024
    dateFormat YYYY-MM-DD
    
    section Planning
        Sprint Planning      :done, plan, 2024-12-01, 1d
        Backlog Grooming    :done, groom, after plan, 1d
    
    section Development
        Feature A - Auth    :active, auth, 2024-12-03, 5d
        Feature B - API     :api, after auth, 4d
        Feature C - UI      :ui, 2024-12-05, 6d
    
    section Testing
        Unit Tests          :test1, after api, 2d
        Integration Tests   :test2, after test1, 2d
        QA Review           :qa, after ui, 3d
    
    section Deployment
        Staging Deploy      :staging, after qa, 1d
        Production Release  :prod, after staging, 1d`,
  },
  {
    id: 'tech-pie',
    name: 'Tech Stack Distribution',
    description: 'Project technology breakdown',
    category: 'pie',
    code: `pie showData
    title Technology Distribution
    "TypeScript" : 45
    "React" : 25
    "Node.js" : 15
    "PostgreSQL" : 10
    "Docker" : 5`,
  },
  {
    id: 'architecture-mindmap',
    name: 'System Architecture',
    description: 'High-level system overview',
    category: 'mindmap',
    code: `mindmap
  root((System))
    Frontend
      React
      TypeScript
      TailwindCSS
      Zustand
    Backend
      Node.js
      Express
      GraphQL
      REST API
    Database
      PostgreSQL
      Redis
      S3 Storage
    Infrastructure
      AWS
      Docker
      Kubernetes
      CI/CD`,
  },
  {
    id: 'microservices-flow',
    name: 'Microservices Architecture',
    description: 'Service communication patterns',
    category: 'flowchart',
    code: `flowchart LR
    subgraph Client
        A[📱 Mobile App]
        B[🌐 Web App]
    end
    
    subgraph Gateway
        C[🚪 API Gateway]
    end
    
    subgraph Services
        D[👤 User Service]
        E[📦 Product Service]
        F[🛒 Order Service]
        G[💳 Payment Service]
    end
    
    subgraph Data
        H[(Users DB)]
        I[(Products DB)]
        J[(Orders DB)]
    end
    
    subgraph Messaging
        K[📨 Message Queue]
    end
    
    A --> C
    B --> C
    C --> D & E & F & G
    D --> H
    E --> I
    F --> J
    F --> K
    G --> K
    K --> D & E
    
    style C fill:#0ea5e9,stroke:#0284c7,color:#fff
    style K fill:#8b5cf6,stroke:#7c3aed,color:#fff`,
  },
  {
    id: 'ci-cd-flow',
    name: 'CI/CD Pipeline',
    description: 'Automated deployment workflow',
    category: 'flowchart',
    code: `flowchart TD
    A[👨‍💻 Git Push] --> B[🔍 Lint & Format]
    B --> C{Tests Pass?}
    C -->|Yes| D[📦 Build]
    C -->|No| E[❌ Notify Team]
    E --> A
    D --> F[🐳 Docker Build]
    F --> G[📤 Push to Registry]
    G --> H{Branch?}
    H -->|main| I[🚀 Deploy Staging]
    H -->|release| J[🎯 Deploy Production]
    I --> K[🧪 E2E Tests]
    K --> L{All Green?}
    L -->|Yes| M[✅ Ready for Prod]
    L -->|No| E
    J --> N[📊 Monitor]
    
    style A fill:#0ea5e9,stroke:#0284c7,color:#fff
    style J fill:#22c55e,stroke:#16a34a,color:#fff
    style E fill:#ef4444,stroke:#dc2626,color:#fff`,
  },
  {
    id: 'git-flow',
    name: 'Git Branching Strategy',
    description: 'Version control workflow',
    category: 'flowchart',
    code: `gitGraph
    commit id: "init"
    branch develop
    commit id: "setup"
    branch feature/auth
    commit id: "auth-start"
    commit id: "auth-done"
    checkout develop
    merge feature/auth
    branch feature/api
    commit id: "api-endpoints"
    checkout develop
    merge feature/api
    checkout main
    merge develop tag: "v1.0.0"
    checkout develop
    branch hotfix/bug
    commit id: "fix-bug"
    checkout main
    merge hotfix/bug tag: "v1.0.1"
    checkout develop
    merge hotfix/bug`,
  },
];

export const categories = [
  { id: 'flowchart', name: 'Flowcharts', icon: '📊' },
  { id: 'sequence', name: 'Sequence', icon: '🔄' },
  { id: 'class', name: 'Class', icon: '📐' },
  { id: 'state', name: 'State', icon: '🔀' },
  { id: 'er', name: 'ER Diagram', icon: '🗄️' },
  { id: 'journey', name: 'Journey', icon: '🗺️' },
  { id: 'gantt', name: 'Gantt', icon: '📅' },
  { id: 'pie', name: 'Pie Chart', icon: '🥧' },
  { id: 'mindmap', name: 'Mind Map', icon: '🧠' },
] as const;
