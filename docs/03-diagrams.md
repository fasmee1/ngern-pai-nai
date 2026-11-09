# แผนผังระบบ "เงินไปไหน"

ยืนยันโดยคุณฟัซมีเมื่อ 7 พฤศจิกายน 2569 (2026-11-07)

## 1. ขั้นตอนการใช้งาน

```mermaid
flowchart TB
    start([เปิดระบบจากไอคอน]) --> loggedIn{เข้าระบบแล้วหรือยัง}
    loggedIn -- ยังไม่ได้เข้า --> login[เข้าระบบด้วย Google]
    loggedIn -- เข้าแล้ว --> home[หน้าสรุป: ประโยคสั้นและกราฟแยกหมวด]
    login --> home
    home --> action{อยากทำอะไร}
    action -- จดรายการ --> add[/จดรายการ: เงิน วันที่ หมวด โน้ต บัญชี/]
    action -- แก้รายการ --> edit[แก้หรือลบรายการ และกดย้อนการลบได้]
    action -- ตั้งงบ --> budget[/ตั้งงบแต่ละหมวด/]
    action -- ลบบัญชี --> account[ลบบัญชีและข้อมูลของตัวเอง]
    action -- เสร็จแล้ว --> finish([จบการใช้งาน])
    add --> valid{ข้อมูลครบไหม}
    valid -- ไม่ครบ --> add
    valid -- ครบ --> save[บันทึกและคำนวณยอดใหม่]
    save --> over{ใช้เกินงบไหม}
    over -- เกิน --> kind[แสดงข้อความแบบใจดีในหน้าสรุป]
    over -- ไม่เกิน --> home
    kind --> home
    edit --> save
    budget --> home
    account --> finish
```

## 2. การไหลของข้อมูล

```mermaid
flowchart LR
    user[ผู้ใช้]
    google[Google]
    auth((เข้าระบบและตรวจตัวตน))
    record((จด แก้ และลบรายการ))
    budgetP((จัดการงบ))
    summary((สร้างสรุปและเทียบงบ))
    accountP((ลบบัญชีและข้อมูล))
    profiles[(ข้อมูลผู้ใช้)]
    accounts[(บัญชีเงิน)]
    categories[(หมวดหมู่)]
    transactions[(รายการรับจ่าย)]
    budgets[(งบรายหมวด)]

    user -- ขอเข้าระบบ --> auth
    auth -- ขอยืนยันตัวตน --> google
    google -- ผลยืนยันตัวตน --> auth
    auth -- ข้อมูลผู้ใช้ --> profiles
    user -- ข้อมูลรายการ --> record
    accounts -- รายชื่อบัญชี --> record
    categories -- รายชื่อหมวด --> record
    record -- รายการที่บันทึก --> transactions
    user -- จำนวนงบ --> budgetP
    budgetP -- งบที่บันทึก --> budgets
    transactions -- ยอดรับจ่าย --> summary
    budgets -- งบแต่ละหมวด --> summary
    summary -- ประโยคสรุปและกราฟ --> user
    user -- คำขอลบบัญชี --> accountP
    accountP -- ลบข้อมูลผู้ใช้และข้อมูลทั้งหมด --> profiles
```

ข้อมูลเงินไม่ถูกส่งไปที่ Google โดย Google ทำหน้าที่ยืนยันตัวตนเท่านั้น

## 3. ตารางข้อมูล

```mermaid
erDiagram
    profiles ||--o{ accounts : has
    profiles ||--o{ categories : has
    profiles ||--o{ transactions : records
    profiles ||--o{ budgets : sets
    accounts ||--o{ transactions : used_in
    categories ||--o{ transactions : groups
    categories ||--o{ budgets : budgeted_by

    profiles {
        uuid id PK
        text display_name
        timestamptz created_at
    }
    accounts {
        uuid id PK
        uuid user_id FK
        text name
        timestamptz created_at
    }
    categories {
        uuid id PK
        uuid user_id FK
        text name
        text type "income or expense"
        timestamptz created_at
    }
    transactions {
        uuid id PK
        uuid user_id FK
        uuid account_id FK
        uuid category_id FK
        text type "income or expense"
        bigint amount_satang
        date occurred_on
        text note
        timestamptz deleted_at
        timestamptz created_at
    }
    budgets {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        date month
        bigint amount_satang
    }
```

## หมายเหตุการออกแบบ

- เก็บเงินเป็นหน่วยสตางค์ เพื่อให้บวกลบตรงทุกบาท
- ตอนกดลบ ระบบทำเครื่องหมายใน `deleted_at` ก่อน จึงกดย้อนการลบได้
- บัญชีเงินเก็บแค่ชื่อที่ผู้ใช้ตั้งเอง ไม่เก็บเลขบัญชีธนาคารจริง
