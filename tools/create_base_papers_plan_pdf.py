from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
OUT_FILE = OUT_DIR / "base_papers_and_10_week_plan.pdf"


def para(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text.replace("\n", "<br/>"), style)


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawRightString(285 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    doc = BaseDocTemplate(
        str(OUT_FILE),
        pagesize=landscape(A4),
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=13 * mm,
        bottomMargin=15 * mm,
        title="Base Papers and 10 Week Project Plan",
        author="Smart Carbon Credit Analytics Project Team",
    )

    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="normal",
    )
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=add_page_number)])

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=25,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#17324D"),
        spaceAfter=8,
    )
    subtitle = ParagraphStyle(
        "SubtitleCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#475467"),
        spaceAfter=12,
    )
    section = ParagraphStyle(
        "SectionCustom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#17324D"),
        spaceBefore=8,
        spaceAfter=7,
    )
    normal = ParagraphStyle(
        "NormalCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#101828"),
    )
    small = ParagraphStyle(
        "SmallCustom",
        parent=normal,
        fontSize=8,
        leading=10.5,
    )
    header = ParagraphStyle(
        "HeaderCustom",
        parent=small,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
        textColor=colors.white,
    )
    cell = ParagraphStyle(
        "CellCustom",
        parent=small,
        alignment=TA_LEFT,
    )
    bold_cell = ParagraphStyle(
        "BoldCellCustom",
        parent=cell,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#17324D"),
    )

    story = []

    story.append(para("Base Papers and 10 Week Project Plan", title))
    story.append(
        para(
            "Smart Carbon Credit Analytics and Industrial Emission Forecasting Platform",
            subtitle,
        )
    )

    story.append(para("Selected Base Papers", section))
    paper_data = [
        [para("No.", header), para("Publisher / Year", header), para("Paper Link", header), para("DOI", header)],
        [
            para("1", bold_cell),
            para("Elsevier, 2026", cell),
            para("https://www.sciencedirect.com/science/article/abs/pii/S1364815225004128", cell),
            para("10.1016/j.envsoft.2025.106728", cell),
        ],
        [
            para("2", bold_cell),
            para("Elsevier, 2024", cell),
            para("https://www.sciencedirect.com/science/article/abs/pii/S0959652624020535", cell),
            para("10.1016/j.jclepro.2024.142605", cell),
        ],
        [
            para("3", bold_cell),
            para("Springer, 2025", cell),
            para("https://link.springer.com/article/10.1007/s11356-024-35764-8", cell),
            para("10.1007/s11356-024-35764-8", cell),
        ],
    ]
    paper_table = Table(
        paper_data,
        colWidths=[12 * mm, 38 * mm, 141 * mm, 63 * mm],
        repeatRows=1,
        hAlign="LEFT",
    )
    paper_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17324D")),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D0D5DD")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F9FAFB")),
            ]
        )
    )
    story.append(paper_table)
    story.append(Spacer(1, 8))
    story.append(
        para(
            "Project improvement: The selected papers support carbon emission forecasting using machine learning, deep learning, temporal features, and BiLSTM-based methods. Our project improves this idea by applying it to facility-level iron and steel emissions data, adding log transformation, facility-wise lag and rolling features, BiLSTM training, carbon credit calculation, dashboard analytics, admin control, and PDF report generation.",
            normal,
        )
    )

    story.append(PageBreak())
    story.append(para("10 Week Work Plan for 3 Members", section))

    rows = [
        [
            "Week",
            "Main Work",
            "Member 1",
            "Member 2",
            "Member 3",
        ],
        [
            "Week 1",
            "Project understanding and domain study",
            "Study carbon credits, emission forecasting, iron & steel sector",
            "Study similar dashboards and UI ideas",
            "Finalize project modules, architecture, tech stack",
        ],
        [
            "Week 2",
            "Dataset searching and data study",
            "Search Climate TRACE / iron-steel datasets, note columns",
            "Prepare basic page flow: login, dashboard, prediction, reports",
            "Select final dataset, understand target column, decide ML approach",
        ],
        [
            "Week 3",
            "Data preprocessing start",
            "Check missing values, duplicate values, column meanings",
            "Create basic frontend layout and navigation",
            "Build preprocessing pipeline: cleaning, encoding, feature selection",
        ],
        [
            "Week 4",
            "Feature engineering and training data preparation",
            "Prepare preprocessing notes and screenshots",
            "Build auth pages and dashboard skeleton",
            "Create lag features, rolling averages, temporal features, final training dataset",
        ],
        [
            "Week 5",
            "Model training",
            "Help compare metrics and prepare result table",
            "Build prediction input form UI",
            "Train BiLSTM model, save model, scaler, evaluate RMSE/MAE/R2",
        ],
        [
            "Week 6",
            "Backend core modules",
            "Prepare API documentation draft",
            "Connect frontend pages with dummy APIs",
            "Build FastAPI backend, database models, JWT auth, prediction API",
        ],
        [
            "Week 7",
            "Carbon credit and analytics module",
            "Write carbon credit formula explanation",
            "Build carbon credit page and charts UI",
            "Implement carbon credit calculation, dashboard analytics APIs",
        ],
        [
            "Week 8",
            "Reports and admin module",
            "Prepare report content format",
            "Build reports page, admin pages, tables",
            "Implement PDF report generation, audit logs, admin APIs",
        ],
        [
            "Week 9",
            "Full integration and testing",
            "Test with sample data, note bugs",
            "Test UI responsiveness and API flow",
            "Fix integration bugs, validate model output, secure APIs",
        ],
        [
            "Week 10",
            "Final report, PPT, demo",
            "Write dataset/preprocessing section",
            "Add screenshots, UI explanation, PPT design",
            "Final demo setup, architecture explanation, model/backend explanation",
        ],
    ]

    table_data = [[para(col, header) for col in rows[0]]]
    for row in rows[1:]:
        table_data.append([para(row[0], bold_cell)] + [para(col, cell) for col in row[1:]])

    plan_table = Table(
        table_data,
        colWidths=[19 * mm, 53 * mm, 57 * mm, 57 * mm, 82 * mm],
        repeatRows=1,
        hAlign="LEFT",
    )
    plan_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17324D")),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#D0D5DD")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ]
        )
    )
    story.append(plan_table)

    story.append(Spacer(1, 8))
    story.append(
        KeepTogether(
            [
                para("Workload Note", section),
                para(
                    "Member 3 handles the main technical backbone: dataset finalization, preprocessing pipeline, feature engineering, BiLSTM model training, backend APIs, prediction integration, carbon credit calculation, PDF report generation, and final integration. Member 1 and Member 2 support with research, documentation, frontend UI, testing, screenshots, and presentation work.",
                    normal,
                ),
            ]
        )
    )

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUT_FILE)
