# COUNTLAH MVP SPEC (v1)

## 1. Goal
Build an end-to-end system:
Upload invoice (PDF) → OCR/Parse → AI extract structured data → Review → Push to Xero

---

## 2. Core Flow

[ landing ]  
→ [ admin login (/admin) ]  
→ [ connect Xero (OAuth) ]  
→ [ upload invoice (PDF) ]  
→ [ OCR / text extraction ]  
→ [ AI extraction (structured JSON) ]  
→ [ review + edit ]  
→ [ map to Xero fields ]  
→ [ create/check contact ]  
→ [ push to Xero ]  
→ [ save logs + status ]  
→ [ retry if failed ]

---

## 3. System Architecture

### Backend (Node.js)
- Express server
- SQLite database
- File upload (multer)
- PDF parsing (pdf-parse)
- AI extraction (OpenAI API)

### Frontend (MVP)
- Simple UI or Postman
- Admin-only access

---

## 4. Database Schema

### invoices
- id
- filename
- raw_text
- extracted_json
- supplier
- amount
- status (uploaded / extracted / pushed / failed)
- created_at

### logs
- id
- invoice_id
- status
- message
- created_at

### config
- key
- value

---

## 5. Admin Auth
- Single admin
- Credentials from .env

---

## 6. Extraction Logic

Step 1: Extract raw text from PDF  
Step 2: Send to AI with strict prompt  
Step 3: Return structured JSON:

{
  supplier_name,
  invoice_number,
  invoice_date,
  due_date,
  currency,
  subtotal,
  tax,
  total,
  line_items: [
    { description, quantity, unit_price, amount }
  ]
}

---

## 7. Xero Mapping (target)

- Contact → supplier_name
- InvoiceNumber → invoice_number
- Date → invoice_date
- DueDate → due_date
- LineItems → line_items
- Total → total
- Tax → tax

---

## 8. Constraints
- No mock data
- Real extraction required
- Minimal UI
- Focus on accuracy + stability

---

## 9. Future (not in MVP)
- Multi-user
- Advanced dashboard
- Analytics
- AI confidence scoring
