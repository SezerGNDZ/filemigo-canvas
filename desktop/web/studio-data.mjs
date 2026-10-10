export const studioTools=[
 {id:'flowchart',group:'diagram',icon:'merge',en:['Flowchart maker','Turn a process into a clear, downloadable flowchart.'],tr:['Akış şeması','Bir süreci anlaşılır, indirilebilir bir şemaya dönüştür.']},
 {id:'uml-class',group:'diagram',icon:'merge',en:['UML class diagram','Model classes, attributes, methods and relationships.'],tr:['UML sınıf diyagramı','Sınıfları, özellikleri, metotları ve ilişkileri modelle.']},
 {id:'sequence-diagram',group:'diagram',icon:'split',en:['Sequence diagram','Show how people and systems interact, step by step.'],tr:['Sıralama diyagramı','Kişi ve sistemlerin etkileşimini adım adım göster.']},
 {id:'er-diagram',group:'diagram',icon:'merge',en:['ER diagram','Map database entities, keys and cardinalities.'],tr:['ER diyagramı','Veritabanı varlıklarını, anahtarları ve ilişkileri çiz.']},
 {id:'assignment-cover',group:'student',icon:'image',en:['Assignment cover','A polished A4 cover for your next submission.'],tr:['Ödev kapağı','Bir sonraki teslimin için özenli bir A4 kapak hazırla.']},
 {id:'weekly-planner',group:'student',icon:'crop',en:['Weekly timetable','Design a printable weekly class or study schedule.'],tr:['Haftalık ders programı','Yazdırılabilir ders veya çalışma programını tasarla.']}
];
const example=(id,tool,en,tr,code)=>({id,tool,en,tr,code});
export const studioTemplates=[
 example('project-flow','flowchart','Project workflow','Proje iş akışı',`flowchart TD
  A[Define the problem] --> B[Research]
  B --> C[Build a prototype]
  C --> D{Tests pass?}
  D -- Yes --> E[Deliver the project]
  D -- No --> F[Review and improve]
  F --> C`),
 example('study-flow','flowchart','Study session','Çalışma oturumu',`flowchart TD
  A[Choose a topic] --> B[Read and take notes]
  B --> C[Practice questions]
  C --> D{Understand the topic?}
  D -- Yes --> E[Review tomorrow]
  D -- No --> F[Revisit difficult parts]
  F --> C`),
 example('order-flow','flowchart','Order processing','Sipariş süreci',`flowchart LR
  A[New order] --> B{In stock?}
  B -- Yes --> C[Confirm payment]
  C --> D[Pack order]
  D --> E[Ship]
  B -- No --> F[Notify customer]`),
 example('bug-flow','flowchart','Bug triage','Hata değerlendirme',`flowchart TD
  A[Report received] --> B{Reproducible?}
  B -- Yes --> C[Set priority]
  C --> D[Implement fix]
  D --> E[Regression test]
  E --> F[Close issue]
  B -- No --> G[Request details]
  G --> A`),
 example('library-class','uml-class','Library system','Kütüphane sistemi',`classDiagram
  class Book {
    +String title
    +String isbn
    +isAvailable() bool
  }
  class Member {
    +String name
    +borrowBook()
  }
  class Loan {
    +Date dueDate
    +returnBook()
  }
  Member "1" --> "0..*" Loan : borrows
  Book "1" --> "0..*" Loan : records`),
 example('shop-class','uml-class','Online shop','Çevrimiçi mağaza',`classDiagram
  class Customer {
    +String email
    +placeOrder()
  }
  class Order {
    +int number
    +calculateTotal() float
  }
  class OrderItem {
    +int quantity
    +float unitPrice
  }
  Customer "1" --> "0..*" Order
  Order "1" *-- "1..*" OrderItem`),
 example('school-class','uml-class','Course enrollment','Ders kaydı',`classDiagram
  class Student {
    +String studentId
    +enroll()
  }
  class Course {
    +String code
    +int credits
  }
  class Enrollment {
    +String semester
    +float grade
  }
  Student "1" --> "0..*" Enrollment
  Course "1" --> "0..*" Enrollment`),
 example('shapes-class','uml-class','Inheritance basics','Kalıtım örneği',`classDiagram
  class Shape {
    <<abstract>>
    +area() float
    +perimeter() float
  }
  class Circle {
    +float radius
  }
  class Rectangle {
    +float width
    +float height
  }
  Shape <|-- Circle
  Shape <|-- Rectangle`),
 example('login-sequence','sequence-diagram','User sign-in','Kullanıcı girişi',`sequenceDiagram
  actor User
  participant App
  participant Auth
  User->>App: Enter credentials
  App->>Auth: Validate credentials
  alt Valid credentials
    Auth-->>App: Session created
    App-->>User: Show dashboard
  else Invalid credentials
    Auth-->>App: Access denied
    App-->>User: Show error
  end`),
 example('checkout-sequence','sequence-diagram','Checkout','Ödeme akışı',`sequenceDiagram
  actor Customer
  participant Store
  participant Payment
  Customer->>Store: Place order
  Store->>Payment: Request authorization
  Payment-->>Store: Authorized
  Store-->>Customer: Order confirmation`),
 example('api-sequence','sequence-diagram','API request','API isteği',`sequenceDiagram
  participant Browser
  participant Server
  participant Database
  Browser->>Server: GET items
  Server->>Database: Query items
  Database-->>Server: Result rows
  Server-->>Browser: JSON response`),
 example('booking-sequence','sequence-diagram','Room reservation','Oda rezervasyonu',`sequenceDiagram
  actor Guest
  participant Booking
  participant Hotel
  Guest->>Booking: Select dates
  Booking->>Hotel: Check availability
  Hotel-->>Booking: Available rooms
  Booking-->>Guest: Show options
  Guest->>Booking: Confirm room
  Booking->>Hotel: Reserve room
  Hotel-->>Guest: Confirmation`),
 example('library-er','er-diagram','Library database','Kütüphane veritabanı',`erDiagram
  MEMBER ||--o{ LOAN : borrows
  BOOK ||--o{ LOAN : records
  MEMBER {
    int id PK
    string name
    string email
  }
  BOOK {
    int id PK
    string title
    string isbn
  }
  LOAN {
    int id PK
    int member_id FK
    int book_id FK
    date due_date
  }`),
 example('shop-er','er-diagram','Orders database','Sipariş veritabanı',`erDiagram
  CUSTOMER ||--o{ ORDERS : places
  ORDERS ||--|{ ORDER_ITEM : contains
  CUSTOMER {
    int id PK
    string email
  }
  ORDERS {
    int id PK
    int customer_id FK
    date created_at
  }
  ORDER_ITEM {
    int id PK
    int order_id FK
    int quantity
    decimal price
  }`),
 example('school-er','er-diagram','Student records','Öğrenci kayıtları',`erDiagram
  STUDENT ||--o{ ENROLLMENT : has
  COURSE ||--o{ ENROLLMENT : includes
  STUDENT {
    int id PK
    string name
  }
  COURSE {
    int id PK
    string title
  }
  ENROLLMENT {
    int student_id FK
    int course_id FK
    string semester
  }`),
 example('blog-er','er-diagram','Publishing database','Yayın veritabanı',`erDiagram
  AUTHOR ||--o{ POST : writes
  POST ||--o{ COMMENT : receives
  AUTHOR {
    int id PK
    string name
  }
  POST {
    int id PK
    int author_id FK
    string title
  }
  COMMENT {
    int id PK
    int post_id FK
    string body
  }`),
 {id:'editorial-cover',tool:'assignment-cover',en:'Editorial cover',tr:'Modern ödev kapağı',layout:'editorial'},
 {id:'classic-cover',tool:'assignment-cover',en:'Classic report',tr:'Klasik rapor kapağı',layout:'classic'},
 {id:'class-week',tool:'weekly-planner',en:'Class timetable',tr:'Ders programı',layout:'classes'},
 {id:'study-week',tool:'weekly-planner',en:'Study planner',tr:'Çalışma planı',layout:'study'}
];
export const themes={rose:{ink:'#3d2938',accent:'#b84970',soft:'#f9e8ee'},ocean:{ink:'#203b49',accent:'#216a80',soft:'#e2f1f4'},sage:{ink:'#304439',accent:'#4e785f',soft:'#e9f0e5'}};
export function newProject(template,lang='en'){
 const tr=lang==='tr',p={format:'filemigo-studio',version:1,tool:template.tool,title:template[lang],theme:'rose'};
 if(template.code)p.code=template.code;
 if(template.tool==='assignment-cover')p.fields={layout:template.layout,institution:tr?'ÜNİVERSİTE ADI':'UNIVERSITY NAME',department:tr?'Fakülte / Bölüm':'Faculty / Department',course:tr?'DERS ADI':'COURSE NAME',headline:tr?'Proje Başlığı':'Project Title',subtitle:tr?'Araştırma ve proje raporu':'Research & project report',student:tr?'Ad Soyad':'Your Name',studentId:'20260001',teacher:tr?'Öğretim Elemanı':'Instructor Name',date:'2026',footer:tr?'DÖNEM PROJESİ':'TERM PROJECT'};
 if(template.tool==='weekly-planner'){
  p.fields={subtitle:tr?'Küçük adımlar. Düzenli ilerleme.':'Small steps. Steady progress.',note:tr?'Bu haftanın hedefi:':'This week’s focus:',days:tr?'Pazartesi,Salı,Çarşamba,Perşembe,Cuma':'Monday,Tuesday,Wednesday,Thursday,Friday'};
  const subjects=tr?(template.layout==='study'?['Tekrar','Soru çözümü','Okuma','Proje','Deneme']:['Matematik','Fizik','İngilizce','Programlama','Tasarım']):(template.layout==='study'?['Review','Practice','Reading','Project','Mock exam']:['Mathematics','Physics','English','Programming','Design']);
  p.rows=Array.from({length:6},(_,i)=>({time:`${String(9+i).padStart(2,'0')}:00`,cells:Array.from({length:5},(_,j)=>i===3?(tr?'Ara':'Break'):subjects[(i+j)%5])}));
 }
 return p;
}
