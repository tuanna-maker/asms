from pathlib import Path
p = Path("src/components/details/CustomerDetailDialog.tsx")
t = p.read_text(encoding="utf-8")
bad = "</" + "motion.div" + ">"
t = t.replace(bad, "</div>")
p.write_text(t, encoding="utf-8")
print("motion left:", t.count("motion"))
