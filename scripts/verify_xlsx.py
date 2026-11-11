#!/usr/bin/env python3
"""Verify the demo PF.xlsx produced by the HTML's own code.

Generates /tmp/pf-demo.xlsx via scripts/gen_demo_xlsx.cjs, then checks
it with openpyxl: 3 tabs, headers, formulas, ROUND to 4, print setup,
number formats, no real-case strings. Then, if LibreOffice is present,
converts it to PDF to prove Calc opens it and computes the plain formulas.

Usage: python3 scripts/verify_xlsx.py [/tmp/pf-demo.xlsx]
"""
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/pf-demo.xlsx")

failures = []


def check(name, cond, extra=""):
    print(("  ok  " if cond else "FAIL  ") + name + ("" if cond else f" — {extra}"))
    if not cond:
        failures.append(name)


def main():
    r = subprocess.run(
        ["node", str(ROOT / "scripts" / "gen_demo_xlsx.cjs"), str(OUT)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("FAIL  could not generate the demo xlsx:", r.stderr.strip())
        sys.exit(1)
    print(r.stdout.strip())

    import openpyxl
    wb = openpyxl.load_workbook(str(OUT))
    check("workbook has 3 tabs", wb.sheetnames == ["ERF-2020", "LRF-2020", "BFCF-2020 SLA->JS50"],
          str(wb.sheetnames))

    erf = wb["ERF-2020"]
    check("ERF header: plan name", erf["A1"].value == "Riverbend Manufacturing Pension Plan", repr(erf["A1"].value))
    check("ERF header: case number", erf["A2"].value == "Case Number: 98765400", repr(erf["A2"].value))
    check("ERF header: DOPT", erf["A3"].value == "DOPT: 2025-06-30", repr(erf["A3"].value))
    check("ERF header: title", "Early Retirement Factors" in (erf["A5"].value or ""))
    check("ERF header: basis", "1/15" in (erf["A6"].value or ""))
    check("ERF header: normal form", erf["A7"].value == "Normal single form: SLA", repr(erf["A7"].value))
    check("ERF row 10 headers", erf["A10"].value == "Months" and erf["B10"].value == "Factor")
    check("ERF B11 formula is plain ROUND", erf["B11"].value == "=ROUND(1-(A11/180),4)", repr(erf["B11"].value))
    check("ERF B11 format is 0.0000", erf["B11"].number_format == "0.0000", erf["B11"].number_format)
    check("ERF last month is 120", erf["I34"].value == 120, repr(erf["I34"].value))
    check("ERF J34 formula references I34", erf["J34"].value == "=ROUND(1-(I34/180),4)", repr(erf["J34"].value))
    check("ERF print area is full table", erf.print_area == "'ERF-2020'!$A$1:$J$34", erf.print_area)
    check("ERF print titles rows 1:10", str(erf.print_title_rows) == "$1:$10", str(erf.print_title_rows))
    check("ERF landscape", erf.page_setup.orientation == "landscape")
    check("ERF fit 1 x 2", erf.page_setup.fitToWidth == 1 and erf.page_setup.fitToHeight == 2)
    check("ERF fitToPage on", erf.sheet_properties.pageSetUpPr.fitToPage is True)
    check("ERF margins 0.4/0.4/0.5/0.5",
          (erf.page_margins.left, erf.page_margins.right, erf.page_margins.top, erf.page_margins.bottom) == (0.4, 0.4, 0.5, 0.5))

    lrf = wb["LRF-2020"]
    check("LRF B11 formula is LRFAEQ", lrf["B11"].value == '=ROUND(LRFAEQ(0.05,"M",65,A11,0,"GM83","GF83","MP","Y"),4)', repr(lrf["B11"].value))
    check("LRF print area", lrf.print_area == "'LRF-2020'!$A$1:$J$34", lrf.print_area)
    check("LRF landscape + fit", lrf.page_setup.orientation == "landscape" and lrf.page_setup.fitToWidth == 1 and lrf.page_setup.fitToHeight == 2)
    check("LRF merges and freeze match ERF", {str(r) for r in lrf.merged_cells.ranges} == {f"A{i}:J{i}" for i in range(1, 9)} and lrf.freeze_panes == "A11")

    bf = wb["BFCF-2020 SLA->JS50"]
    check("BFCF header: plan name in B1", bf["B1"].value == "Riverbend Manufacturing Pension Plan", repr(bf["B1"].value))
    check("BFCF header: case number in B2", bf["B2"].value == "Case Number: 98765400", repr(bf["B2"].value))
    check("BFCF header: DOPT in B3", bf["B3"].value == "DOPT: 2025-06-30", repr(bf["B3"].value))
    check("BFCF header: title in B5", "Benefit Form Conversion Factors" in (bf["B5"].value or ""))
    check("BFCF header: normal form in B7", bf["B7"].value == "Normal single form: SLA", repr(bf["B7"].value))
    check("BFCF row 9 label at C9", bf["C9"].value == "Participant's Age Nearest Birthday", repr(bf["C9"].value))
    check("BFCF B10 is Age", bf["B10"].value == "Age", repr(bf["B10"].value))
    check("BFCF A11 is ben-age label", bf["A11"].value == "Beneficiary's Age Nearest Birthday", repr(bf["A11"].value))
    check("BFCF row 10 participant ages", bf["C10"].value == 55 and bf["H10"].value == 60,
          f"C10={bf['C10'].value} H10={bf['H10'].value}")
    check("BFCF beneficiary ages in col B", bf["B11"].value == 0 and bf["B16"].value == 5,
          f"B11={bf['B11'].value} B16={bf['B16'].value}")
    check("BFCF C11 formula is BFCFAEQ",
          bf["C11"].value == '=ROUND(BFCFAEQ("SLA",0,36,0,"JSC",0.5,0,0,C10,B11,"M","M",0.08,"UP84M2","UP84M2","MP","N"),4)',
          repr(bf["C11"].value))
    check("BFCF C11 format is 0.0000", bf["C11"].number_format == "0.0000")
    check("BFCF print area is full grid", bf.print_area == "'BFCF-2020 SLA->JS50'!$A$1:$H$16", bf.print_area)
    check("BFCF print titles rows 1:10", str(bf.print_title_rows) == "$1:$10")
    check("BFCF landscape + fit", bf.page_setup.orientation == "landscape" and bf.page_setup.fitToWidth == 1)

    # Layout parity with the reference file (template layout, synthetic data).
    check("ERF merges are header rows 1-8",
          {str(r) for r in erf.merged_cells.ranges} == {f"A{i}:J{i}" for i in range(1, 9)},
          str(sorted(str(r) for r in erf.merged_cells.ranges)))
    check("ERF freeze panes at A11", erf.freeze_panes == "A11", str(erf.freeze_panes))
    check("ERF widths are all 10.0",
          all(erf.column_dimensions[c].width == 10.0 for c in "ABCDEFGHIJ"))
    check("BFCF merges match template shape",
          {str(r) for r in bf.merged_cells.ranges} ==
          {f"B{i}:H{i}" for i in range(1, 9)} | {"C9:H9", "A11:A16"},
          str(sorted(str(r) for r in bf.merged_cells.ranges)))
    check("BFCF freeze panes at C11", bf.freeze_panes == "C11", str(bf.freeze_panes))
    check("BFCF widths are 4 then 8.5",
          bf.column_dimensions["A"].width == 4.0 and
          all(bf.column_dimensions[c].width == 8.5 for c in "BCDEFGH"))

    # No real-case strings anywhere in the file.
    raw = OUT.read_bytes()
    check("no real-case strings in the file", b"24884900" not in raw and b"Saint Rose" not in raw and b"St. Rose" not in raw)
    z = zipfile.ZipFile(str(OUT))
    check("zip is sound", z.testzip() is None)
    check("workbook sets fullCalcOnLoad", b"fullCalcOnLoad" in z.read("xl/workbook.xml"))

    # LibreOffice: prove Calc opens it and computes the plain formulas.
    lo = subprocess.run(["which", "soffice"], capture_output=True, text=True)
    if lo.returncode == 0:
        outdir = Path("/tmp/pf-lo-verify")
        outdir.mkdir(exist_ok=True)
        conv = subprocess.run(
            ["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(outdir), str(OUT)],
            capture_output=True, text=True, timeout=120,
        )
        pdf = outdir / "pf-demo.pdf"
        check("LibreOffice converts the workbook to PDF", conv.returncode == 0 and pdf.exists(),
              conv.stderr.strip()[:200])
        if pdf.exists():
            txt = subprocess.run(["pdftotext", str(pdf), "-"], capture_output=True, text=True)
            check("Calc computed the plain ERF formula (0.9944)",
                  txt.returncode == 0 and "0.9944" in txt.stdout, txt.stderr.strip()[:100])
    else:
        print("  skip  LibreOffice not present, PDF check skipped")

    print(f"\n{len(failures)} failure(s)" if failures else "\nAll xlsx checks passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
