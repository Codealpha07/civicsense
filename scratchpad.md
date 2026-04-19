# CivicSense Proposal Generation Scratchpad

## Objective
Create a professional, detailed, investor-ready proposal (.docx) for CivicSense with rich formatting, pricing bands, funding targets, and target department mapping.

## Current Artifacts
- Compact generator: `civicsense/tools/generate_proposal.py`
- Detailed generator: `civicsense/tools/generate_proposal_detailed.py`
- Windows runner: `civicsense/tools/generate_proposal.bat`
- Requirements: `civicsense/tools/requirements.txt`
- Output (compact): `civicsense/docs/CivicSense_Proposal.docx`
- Output (detailed default): `civicsense/docs/CivicSense_Proposal_Detailed.docx`

## Plan / TODOs
- [x] Add detailed generator script with cover page, footer, tables, rich sections
- [x] Add Windows batch runner and requirements file
- [ ] Generate the detailed proposal document and review
- [ ] Iterate content (branding, cover image, PDF export) if needed

## Run Instructions (Windows)
1) Ensure dependencies are installed (prefer repo venv if present):
```
.venv\Scripts\pip install -r civicsense\tools\requirements.txt
```
Or with system Python:
```
pip install -r civicsense\tools\requirements.txt
```
2) Generate detailed proposal (default output path below):
```
civicsense\tools\generate_proposal.bat
```
Optionally specify a custom output:
```
civicsense\tools\generate_proposal.bat --output "civicsense\docs\CivicSense_Proposal_Detailed.docx"
```

## Embedded Constants (for consistency)
- Department mapping: roads→PWD; water→Water Supply & Sewerage; electric→Electricity Board; environment→Pollution/Environment; sanitation→Municipal Corp (Sanitation); infrastructure→UDA/PWD.
- Pricing bands (INR, annual): Pilot ₹6–12L; Standard City ₹25–45L; Enterprise Metro ₹60–120L.
- Funding: Pre-Seed, INR 3–6 Cr, 12 months runway; use of funds 40/30/20/10.

## Notes / Next Ideas
- Add brand colors, logo, or cover image.
- Add PDF export step (via Word/Pandoc) if required by stakeholders.
- Consider a CLI flag to include/exclude sections.

## Lessons
- python-docx imports: use `from docx.oxml import OxmlElement` and `from docx.oxml.ns import qn` for PAGE fields.
- Batch runner should detect both `.venv` and `venv` on Windows.
- Keep proposal outputs in `civicsense/docs/` to avoid overwriting other artifacts.
