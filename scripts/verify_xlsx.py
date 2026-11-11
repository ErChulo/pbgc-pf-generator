#!/usr/bin/env python3
"""Verify the demo PF.xlsx produced by the HTML's own code.

Generates /tmp/pf-demo.xlsx via scripts/gen_demo_xlsx.cjs, then checks
it with openpyxl: 4 tabs, headers, formulas, ROUND to 4, print setup,
number formats, DEFLATE compression, document properties, no real-case
strings. Then a full 26x101 BFCF grid is generated and checked the
same way. Then, if LibreOffice is present,
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
    check("workbook has 4 tabs", wb.sheetnames == ["ERF-2020", "LRF-2020", "BFCF-2020 SLA->JS50", "BFCF-2020 SLA->JS100"],
          str(wb.sheetnames))
    check("workbook has no JS75 tab (PBGC does not honor it)",
          all("JS75" not in name for name in wb.sheetnames), str(wb.sheetnames))

    # Audit log (written next to the workbook by gen_demo_xlsx.cjs).
    audit_path = Path(str(OUT).replace(".xlsx", "-audit.txt"))
    check("audit log exists", audit_path.exists(), str(audit_path))
    if audit_path.exists():
        audit = audit_path.read_text(encoding="utf-8")
        check("audit log names the excluded JS75 set and its reason",
              "excluded (PBGC does not honor)" in audit and "BFCF-2020-JS75" in audit and
              "to-form JS75 is not the normal married form JS50" in audit, audit)
        check("audit log records the user-added JS100 conversion and that it is included by choice",
              "additional conversion (user-added)" in audit and "BFCF-2020-JS100" in audit and
              "included by your choice" in audit, audit)
        check("audit log records the normal married form",
              "normal married form — JS50" in audit, audit)

    erf = wb["ERF-2020"]
    check("ERF header: plan name", erf["A1"].value == "Riverbend Manufacturing Pension Plan", repr(erf["A1"].value))
    check("ERF header: case number", erf["A2"].value == "Case Number: 98765400", repr(erf["A2"].value))
    check("ERF header: DOPT", erf["A3"].value == "DOPT: 2025-06-30", repr(erf["A3"].value))
    check("ERF header: title", "Early Retirement Factors" in (erf["A5"].value or ""))
    check("ERF header: basis", "1/15" in (erf["A6"].value or ""))
    check("ERF header: normal form", erf["A7"].value == "Normal single form: SLA", repr(erf["A7"].value))
    check("ERF row 10 headers", erf["A10"].value == "Months" and erf["B10"].value == "Factor")
    check("ERF B11 is a table value, not a formula (month 1 = 0.9944)",
          erf["B11"].value == 0.9944 and not isinstance(erf["B11"].value, str), repr(erf["B11"].value))
    check("ERF B11 format is 0.0000", erf["B11"].number_format == "0.0000", erf["B11"].number_format)
    check("ERF months fill down each column (C11=25, E11=49, G11=73, I11=97)",
          (erf["C11"].value, erf["E11"].value, erf["G11"].value, erf["I11"].value) == (25, 49, 73, 97),
          f"C11={erf['C11'].value} E11={erf['E11'].value} G11={erf['G11'].value} I11={erf['I11'].value}")
    check("ERF months end down the last column (A34=24, I34=120)",
          erf["A34"].value == 24 and erf["I34"].value == 120,
          f"A34={erf['A34'].value} I34={erf['I34'].value}")
    check("ERF F22 is a table value (month 60 = 0.6667)",
          erf["F22"].value == 0.6667 and not isinstance(erf["F22"].value, str), repr(erf["F22"].value))
    check("ERF B12 is still a formula (month 2, off the table)",
          erf["B12"].value == "=ROUND(1-(A12/180),4)", repr(erf["B12"].value))
    check("ERF last month is 120", erf["I34"].value == 120, repr(erf["I34"].value))
    check("ERF J34 is a table value (month 120 = 0.3333)",
          erf["J34"].value == 0.3333 and not isinstance(erf["J34"].value, str), repr(erf["J34"].value))
    check("ERF header fonts (A1=14 bold, A2=12 bold, A5=12 bold, A6=11)",
          erf["A1"].font.sz == 14.0 and erf["A1"].font.b is True and
          erf["A2"].font.sz == 12.0 and erf["A2"].font.b is True and
          erf["A5"].font.sz == 12.0 and erf["A5"].font.b is True and
          erf["A6"].font.sz == 11.0 and not erf["A6"].font.b,
          f"A1={erf['A1'].font.sz}/{erf['A1'].font.b} A5={erf['A5'].font.sz}/{erf['A5'].font.b} A6={erf['A6'].font.sz}/{erf['A6'].font.b}")
    check("ERF header row heights (1=20, 5=28, 6=18)",
          erf.row_dimensions[1].height == 20.0 and erf.row_dimensions[5].height == 28.0 and
          erf.row_dimensions[6].height == 18.0,
          f"1={erf.row_dimensions[1].height} 5={erf.row_dimensions[5].height} 6={erf.row_dimensions[6].height}")

    def thin(cell):
        b = cell.border
        return (b.left.style, b.right.style, b.top.style, b.bottom.style) == ("thin", "thin", "thin", "thin")

    check("ERF row-10 headers have thin borders", thin(erf["A10"]) and thin(erf["B10"]))
    check("ERF table cells have thin borders", thin(erf["A11"]) and thin(erf["B11"]) and thin(erf["J34"]))
    check("ERF row-10 headers are centred bold", erf["A10"].alignment.horizontal == "center" and erf["A10"].font.b is True)
    check("ERF table cells are centred", erf["A11"].alignment.horizontal == "center" and erf["B11"].alignment.horizontal == "center")
    check("ERF print area is full table", erf.print_area == "'ERF-2020'!$A$1:$J$34", erf.print_area)
    check("ERF print titles rows 1:10", str(erf.print_title_rows) == "$1:$10", str(erf.print_title_rows))
    check("ERF landscape", erf.page_setup.orientation == "landscape")
    check("ERF fit 1 x 2", erf.page_setup.fitToWidth == 1 and erf.page_setup.fitToHeight == 2)
    check("ERF fitToPage on", erf.sheet_properties.pageSetUpPr.fitToPage is True)
    check("ERF margins 0.4/0.4/0.5/0.5",
          (erf.page_margins.left, erf.page_margins.right, erf.page_margins.top, erf.page_margins.bottom) == (0.4, 0.4, 0.5, 0.5))

    lrf = wb["LRF-2020"]
    check("LRF B11 formula is LRFAEQ with months certain 36 (normal form 3CC)", lrf["B11"].value == '=ROUND(LRFAEQ(0.05,"M",65,A11,36,"GM83","GF83","MP","Y"),4)', repr(lrf["B11"].value))
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
    check("BFCF C11 formula is BFCFAEQ with the plan sexes M/F",
          bf["C11"].value == '=ROUND(BFCFAEQ("SLA",0,36,0,"JSC",0.5,0,0,C10,B11,"M","F",0.08,"UP84M2","UP84M2","MP","N"),4)',
          repr(bf["C11"].value))
    check("BFCF C11 format is 0.0000", bf["C11"].number_format == "0.0000")
    check("BFCF header fonts (B1=14 bold, B5=12 bold, B6=11)",
          bf["B1"].font.sz == 14.0 and bf["B1"].font.b is True and
          bf["B5"].font.sz == 12.0 and bf["B5"].font.b is True and
          bf["B6"].font.sz == 11.0 and not bf["B6"].font.b)
    check("BFCF A11 label is bold and rotated 90",
          bf["A11"].font.b is True and bf["A11"].alignment.textRotation == 90,
          f"rot={bf['A11'].alignment.textRotation}")
    check("BFCF table cells have thin borders", thin(bf["C9"]) and thin(bf["B10"]) and thin(bf["C11"]) and thin(bf["B11"]))
    check("BFCF merge count is 10 (8 headers + C9 + A11)", len(bf.merged_cells.ranges) == 10,
          str(sorted(str(r) for r in bf.merged_cells.ranges)))
    check("BFCF print area is full grid", bf.print_area == "'BFCF-2020 SLA->JS50'!$A$1:$H$16", bf.print_area)
    check("BFCF print titles rows 1:10", str(bf.print_title_rows) == "$1:$10")
    check("BFCF landscape + fit", bf.page_setup.orientation == "landscape" and bf.page_setup.fitToWidth == 1)

    bf100 = wb["BFCF-2020 SLA->JS100"]
    check("JS100 tab: title in B5", "JS100" in (bf100["B5"].value or ""), repr(bf100["B5"].value))
    check("JS100 tab: C11 formula is BFCFAEQ with survivor percent 1",
          bf100["C11"].value == '=ROUND(BFCFAEQ("SLA",0,36,0,"JSC",1,0,0,C10,B11,"M","F",0.08,"UP84M2","UP84M2","MP","N"),4)',
          repr(bf100["C11"].value))
    check("JS100 tab: print area is full grid", bf100.print_area == "'BFCF-2020 SLA->JS100'!$A$1:$H$16", bf100.print_area)
    check("JS100 tab: freeze panes at C11", bf100.freeze_panes == "C11", str(bf100.freeze_panes))

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

    # No real-case strings anywhere in the file (decompressed members).
    raw = OUT.read_bytes()
    check("no real-case strings in the raw file", b"24884900" not in raw and b"Saint Rose" not in raw and b"St. Rose" not in raw)
    z = zipfile.ZipFile(str(OUT))
    check("zip is sound", z.testzip() is None)
    check("workbook sets fullCalcOnLoad", b"fullCalcOnLoad" in z.read("xl/workbook.xml"))
    check("all zip members are DEFLATE-compressed (method 8)",
          all(i.compress_type == zipfile.ZIP_DEFLATED for i in z.infolist()),
          str([(i.filename, i.compress_type) for i in z.infolist()]))
    check("compressed workbook is small (under 40 KB for the demo)",
          OUT.stat().st_size < 40000, str(OUT.stat().st_size))
    core = z.read("docProps/core.xml").decode("utf-8")
    check("document properties name the generator version (v0.4.0)",
          "PF Generator v0.4.0" in core and "schema v0.4.0" in core, core[:200])
    check("document properties carry the case title",
          "98765400 PF" in core, core[:200])
    all_text = b"\n".join(z.read(n) for n in z.namelist()).decode("utf-8", "replace")
    check("no real-case strings in the decompressed workbook",
          "24884900" not in all_text and "Saint Rose" not in all_text and "St. Rose" not in all_text)
    if audit_path.exists():
        audit = audit_path.read_text(encoding="utf-8")
        check("audit log is the full report (versions, input hash, per-set trace)",
              "PF Generator audit report — v0.4.0 (schema v0.4.0)" in audit and
              "Input JSON: hash" in audit and "generator version" in audit, audit[:300])
        check("audit log traces each set with source and formula",
              "effective 2020-01-01" in audit and "formula: =ROUND(BFCFAEQ" in audit, audit[:500])

    # Full 26x101 BFCF grid, end to end.
    full_out = Path("/tmp/pf-full-grid.xlsx")
    r2 = subprocess.run(
        ["node", str(ROOT / "scripts" / "gen_full_grid_xlsx.cjs"), str(full_out)],
        capture_output=True, text=True,
    )
    check("full-grid workbook generates", r2.returncode == 0, r2.stderr.strip())
    if r2.returncode == 0:
        print(r2.stdout.strip())
        check("full-grid workbook is small compressed (under 200 KB)",
              full_out.stat().st_size < 200000, str(full_out.stat().st_size))
        zf = zipfile.ZipFile(str(full_out))
        check("full-grid zip is sound", zf.testzip() is None)
        wbf = openpyxl.load_workbook(str(full_out))
        check("full-grid workbook has 1 tab (BFCF-2020 SLA->JS50)",
              wbf.sheetnames == ["BFCF-2020 SLA->JS50"], str(wbf.sheetnames))
        g = wbf["BFCF-2020 SLA->JS50"]
        check("full-grid dimensions are A1:AB111", g.dimensions == "A1:AB111", g.dimensions)
        check("full-grid C11 formula is BFCFAEQ",
              g["C11"].value == '=ROUND(BFCFAEQ("SLA",0,36,0,"JSC",0.5,0,0,C10,B11,"M","F",0.08,"UP84M2","UP84M2","MP","N"),4)',
              repr(g["C11"].value))
        check("full-grid last cell AB111 is a BFCFAEQ formula",
              isinstance(g["AB111"].value, str) and g["AB111"].value.startswith("=ROUND(BFCFAEQ("),
              repr(g["AB111"].value))
        n_formulas = sum(1 for row in g.iter_rows() for c in row if isinstance(c.value, str) and c.value.startswith("=ROUND(BFCFAEQ("))
        check("full-grid has 2,626 BFCFAEQ formulas", n_formulas == 2626, str(n_formulas))
        check("full-grid print area is the full grid",
              g.print_area == "'BFCF-2020 SLA->JS50'!$A$1:$AB$111", g.print_area)
        check("full-grid freeze panes at C11", g.freeze_panes == "C11", str(g.freeze_panes))

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
            check("Calc shows the ERF month-1 factor (0.9944)",
                  txt.returncode == 0 and "0.9944" in txt.stdout, txt.stderr.strip()[:100])
    else:
        print("  skip  LibreOffice not present, PDF check skipped")

    print(f"\n{len(failures)} failure(s)" if failures else "\nAll xlsx checks passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
