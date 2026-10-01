import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def generate_sale_receipt_pdf(sale, store_info=None):
    """
    Generates a high-quality, professional TRA VFD fiscal electronic receipt PDF.
    Returns the PDF as raw bytes (LargeBinary).
    """
    buffer = io.BytesIO()
    
    # Setup document with clean margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    store_name = (store_info.get('name') if store_info else None) or 'TZA MART TANZANIA'
    store_branch = (store_info.get('branch') if store_info else None) or 'Mlimani City Mall, Sam Nujoma Road, Dar es Salaam'
    store_tin = (store_info.get('tin') if store_info else None) or '102-394-857'
    store_vrn = (store_info.get('vrn') if store_info else None) or '40012983-Z'
    store_phone = (store_info.get('phone') if store_info else None) or '+255 22 211 4455'

    styles = getSampleStyleSheet()

    # Custom styles
    header_title = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1E3A8A')
    )

    header_sub = ParagraphStyle(
        'HeaderSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#475569')
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#0F172A')
    )

    cell_text = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#1E293B')
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#0F172A')
    )

    cell_right = ParagraphStyle(
        'CellRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#1E293B')
    )

    cell_right_bold = ParagraphStyle(
        'CellRightBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#0F172A')
    )

    fiscal_text = ParagraphStyle(
        'FiscalText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#334155')
    )

    fiscal_bold = ParagraphStyle(
        'FiscalBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#1E3A8A')
    )

    footer_text = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#2563EB')
    )

    elements = []

    # 1. HEADER SECTION & STORE LOGO BADGE
    logo_style = ParagraphStyle(
        'LogoBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.white
    )
    logo_badge = Table([[Paragraph("<b>TZA MART TANZANIA</b>", logo_style)]], colWidths=[2.2*inch])
    logo_badge.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#2563EB')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    logo_wrapper = Table([[logo_badge]], colWidths=[7.5*inch])
    logo_wrapper.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(logo_wrapper)
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(store_name, header_title))
    elements.append(Spacer(1, 2))
    elements.append(Paragraph(store_branch, header_sub))
    elements.append(Paragraph(f"TIN: <b>{store_tin}</b> &nbsp;&bull;&nbsp; VRN: <b>{store_vrn}</b> &nbsp;&bull;&nbsp; Tel: {store_phone}", header_sub))
    elements.append(Spacer(1, 5))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#2563EB'), spaceBefore=2, spaceAfter=8))

    # 2. SALE METADATA
    sale_date = sale.date.strftime('%d-%b-%Y') if hasattr(sale.date, 'strftime') else str(sale.date)
    sale_time = sale.time_str or datetime.utcnow().strftime('%H:%M:%S')
    
    meta_data = [
        [
            Paragraph(f"<b>Receipt No:</b> {sale.sale_number}", cell_text),
            Paragraph(f"<b>Date:</b> {sale_date} {sale_time}", cell_text),
        ],
        [
            Paragraph(f"<b>Cashier:</b> {sale.cashier_name or 'Main Cashier'}", cell_text),
            Paragraph(f"<b>Payment:</b> {sale.payment_method}", cell_text)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[3.75*inch, 3.75*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10))

    # 3. PURCHASED ITEMS TABLE (Clean 4-column layout)
    items_table_data = [
        [
            Paragraph("<b>Item Description</b>", cell_bold),
            Paragraph("<b>Qty</b>", cell_bold),
            Paragraph("<b>Unit Price (TZS)</b>", cell_right_bold),
            Paragraph("<b>Total (TZS)</b>", cell_right_bold)
        ]
    ]

    items = getattr(sale, 'items', [])
    for item in items:
        item_sku = f" <font color='#64748B' size='7.5'>({item.sku})</font>" if getattr(item, 'sku', None) else ""
        item_name = f"{item.product_name}{item_sku}"
        qty = item.quantity
        unit_price = f"{item.unit_price:,.0f}"
        item_total = f"{item.total:,.0f}"

        items_table_data.append([
            Paragraph(item_name, cell_text),
            Paragraph(str(qty), cell_text),
            Paragraph(unit_price, cell_right),
            Paragraph(item_total, cell_right_bold)
        ])

    items_table = Table(
        items_table_data,
        colWidths=[4.2*inch, 0.7*inch, 1.3*inch, 1.3*inch]
    )
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 8))

    # 4. TOTALS AND FINANCIAL SUMMARY
    summary_data = [
        [Paragraph("", cell_text), Paragraph("<b>Subtotal (Excl. VAT):</b>", cell_right), Paragraph(f"TZS {sale.subtotal:,.0f}", cell_right)],
        [Paragraph("", cell_text), Paragraph("<b>TRA VAT (18% Included):</b>", cell_right), Paragraph(f"TZS {sale.tax:,.0f}", cell_right)],
        [Paragraph("", cell_text), Paragraph("<b>GRAND TOTAL:</b>", cell_right_bold), Paragraph(f"<b>TZS {sale.total:,.0f}</b>", cell_right_bold)],
    ]
    if sale.payment_method == 'Cash' and getattr(sale, 'amount_paid', 0) > 0:
        summary_data.append([Paragraph("", cell_text), Paragraph("<b>Amount Received:</b>", cell_right), Paragraph(f"TZS {sale.amount_paid:,.0f}", cell_right)])
        summary_data.append([Paragraph("", cell_text), Paragraph("<b>Change Returned:</b>", cell_right_bold), Paragraph(f"<b>TZS {sale.change_amount:,.0f}</b>", cell_right_bold)])

    summary_table = Table(summary_data, colWidths=[4.1*inch, 1.9*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BACKGROUND', (1,2), (2,2), colors.HexColor('#EFF6FF')),
        ('BOX', (1,2), (2,2), 0.75, colors.HexColor('#2563EB')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 10))

    # 5. TRA VFD FISCAL VERIFICATION BADGE
    fiscal_box_data = [
        [
            Paragraph("<b>🇹🇿 TANZANIA REVENUE AUTHORITY (TRA) FISCAL RECORD</b>", fiscal_bold),
            Paragraph("<b>STATUS: VERIFIED</b>", fiscal_bold)
        ],
        [
            Paragraph(f"<b>VFD Receipt No:</b> {sale.fiscal_receipt_no} &nbsp;|&nbsp; <b>EFD:</b> {sale.fiscal_device}", fiscal_text),
            Paragraph(f"<b>Z-Number:</b> {sale.z_number}", fiscal_text)
        ],
        [
            Paragraph(f"<b>TRA Verification Code:</b> {sale.verification_code}", fiscal_bold),
            Paragraph("<b>Official Fiscal Document</b>", fiscal_text)
        ]
    ]
    fiscal_table = Table(fiscal_box_data, colWidths=[5.0*inch, 2.5*inch])
    fiscal_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0FDF4')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#16A34A')),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(KeepTogether([
        fiscal_table,
        Spacer(1, 10),
        HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceBefore=2, spaceAfter=6),
        Paragraph("Asante kwa kununua nasi &bull; Thank you for shopping with us!", footer_text),
    ]))

    # Build PDF
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
