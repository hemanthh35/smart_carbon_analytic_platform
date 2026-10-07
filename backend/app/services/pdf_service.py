"""PDF generation service using ReportLab (pure Python, works on Windows)."""
from __future__ import annotations

import os
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger("services.pdf")

os.makedirs(settings.reports_dir, exist_ok=True)

# ─── Color palette (Official Black & White Corporate Design) ─────────────────
PRIMARY = colors.HexColor("#000000")
ACCENT = colors.HexColor("#333333")
LIGHT_BG = colors.HexColor("#F8F9FA")
TEXT = colors.HexColor("#1A1A1A")
BORDER_COLOR = colors.HexColor("#E5E7EB")
WHITE = colors.white


def _get_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "Cover", parent=styles["Title"],
        fontSize=24, textColor=PRIMARY, alignment=TA_LEFT, spaceAfter=8,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        "SubTitle", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#4B5563"), alignment=TA_LEFT, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "SectionHeader", parent=styles["Heading2"],
        fontSize=12, textColor=PRIMARY, spaceBefore=18, spaceAfter=6,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        "BodyText2", parent=styles["Normal"],
        fontSize=9, textColor=TEXT, leading=14,
    ))
    styles.add(ParagraphStyle(
        "Metric", parent=styles["Normal"],
        fontSize=18, textColor=PRIMARY, alignment=TA_CENTER, spaceAfter=2,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        "MetricLabel", parent=styles["Normal"],
        fontSize=8, textColor=colors.HexColor("#4B5563"), alignment=TA_CENTER,
    ))
    return styles


def _metric_table(metrics: list[tuple[str, str]]) -> Table:
    """Build a row of metric cards."""
    data = [
        [Paragraph(v, _get_styles()["Metric"]) for _, v in metrics],
        [Paragraph(k, _get_styles()["MetricLabel"]) for k, _ in metrics],
    ]
    col_width = (A4[0] - 4 * cm) / len(metrics)
    t = Table(data, colWidths=[col_width] * len(metrics))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return t


def generate_pdf(
    report_data: dict,
    report_type: str = "general",
    output_filename: str | None = None,
) -> str:
    """
    Generate an official compliance PDF report.

    Args:
        report_data: Dict with keys:
            facility_name, country, predicted_emission,
            baseline_emission, reduction, carbon_credits,
            user_name, generated_at (optional)
        report_type: 'general', 'facility', 'country'
        output_filename: Override output file name

    Returns:
        Absolute path to the saved PDF file.
    """
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = output_filename or f"report_{report_type}_{ts}.pdf"
    pdf_path = os.path.join(settings.reports_dir, filename)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )
    styles = _get_styles()
    story = []

    # ── Cover/Header Section ──────────────────────────────────────────────────
    cover_data = [
        [Paragraph("PULSE CARBON COMPLIANCE REPORT", styles["Cover"])],
        [Paragraph(f"Report Type: {report_type.title()} | Generated: {ts[:8]}", styles["SubTitle"])],
    ]
    cover_table = Table(cover_data, colWidths=[A4[0] - 4 * cm])
    cover_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(cover_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=15))

    # ── Key Metrics ───────────────────────────────────────────────────────────
    story.append(Paragraph("Key Metrics", styles["SectionHeader"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=8))

    predicted = report_data.get("predicted_emission", 0)
    baseline = report_data.get("baseline_emission") or 0
    reduction = report_data.get("reduction") or max(0, baseline - predicted)
    credits = report_data.get("carbon_credits") or max(0.0, reduction)

    metrics = [
        ("Predicted Emission (t CO<sub>2</sub>)", f"{predicted:,.1f}"),
        ("Baseline Emission (t CO<sub>2</sub>)", f"{baseline:,.1f}"),
        ("Emission Reduction (t CO<sub>2</sub>)", f"{reduction:,.1f}"),
        ("Carbon Credits Earned", f"{credits:,.1f}"),
    ]
    story.append(_metric_table(metrics))
    story.append(Spacer(1, 0.4 * cm))

    # ── Facility Details ──────────────────────────────────────────────────────
    story.append(Paragraph("Facility Details", styles["SectionHeader"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=8))

    detail_data = [
        ["Field", "Value"],
        ["Facility Name", report_data.get("facility_name", "N/A")],
        ["Country", report_data.get("country", "N/A")],
        ["Report Type", report_type.title()],
        ["Generated By", report_data.get("user_name", "N/A")],
        ["Generated At", report_data.get("generated_at", ts)],
    ]
    detail_table = Table(detail_data, colWidths=[5 * cm, 11 * cm])
    detail_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(detail_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Analysis Summary ──────────────────────────────────────────────────────
    story.append(Paragraph("Analysis Summary", styles["SectionHeader"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=8))

    credit_pct = (credits / baseline * 100) if baseline > 0 else 0
    summary_text = (
        f"The facility <b>{report_data.get('facility_name', 'N/A')}</b> located in "
        f"<b>{report_data.get('country', 'N/A')}</b> has a BiLSTM-predicted emission of "
        f"<b>{predicted:,.1f} t CO<sub>2</sub></b> against a baseline of <b>{baseline:,.1f} t CO<sub>2</sub></b>. "
        f"This represents a reduction of <b>{reduction:,.1f} t CO<sub>2</sub></b>, earning "
        f"<b>{credits:,.1f} carbon credits</b> ({credit_pct:.1f}% of baseline). "
        f"Carbon credits are calculated as: <i>max(0, baseline - predicted)</i>."
    )
    story.append(Paragraph(summary_text, styles["BodyText2"]))
    story.append(Spacer(1, 1 * cm))

    # ── Footer ────────────────────────────────────────────────────────────────
    footer_text = (
        "This report was automatically generated by the Smart Carbon Credit Analytics Platform. "
        "Predictions are powered by a BiLSTM deep learning model trained on global iron and steel "
        "emission data. This document is for official compliance and auditing purposes."
    )
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(footer_text, ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontSize=7, textColor=colors.HexColor("#6B7280"), alignment=TA_CENTER,
    )))

    doc.build(story)
    logger.info(f"PDF generated: {pdf_path}")
    return pdf_path

