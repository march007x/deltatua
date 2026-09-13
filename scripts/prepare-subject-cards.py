#!/usr/bin/env python3
"""
เตรียมภาพการ์ดเลือกวิชา + พื้นหลังหน้าเข้าสู่ระบบ ให้พร้อมขึ้นเว็บ

วิธีใช้:
  python3 scripts/prepare-subject-cards.py math.png physics.png chemistry.png biology.png english.png login.png

รับภาพต้นฉบับ 6 ไฟล์ตามลำดับนี้เท่านั้น (คณิต, ฟิสิกส์, เคมี, ชีวะ, อังกฤษ, พื้นหลังหน้าเข้าสู่ระบบ)
แล้วคายออกมาเป็น:
  public/subjects/{math,physics,chemistry,biology,english}-{720,480,360}.webp   (สัดส่วน 3:4)
  public/login-bg-{900,720,480}.webp                                            (แนวตั้ง)

เหตุผลที่ทำสามขนาดเหมือนภาพพื้นหลังหน้าแรก: การ์ดวิชาบนมือถือกว้างจริงไม่ถึง 200px
การส่งภาพต้นฉบับ 1000px กว่าไปเปลืองเน็ตของผู้เรียนโดยเปล่าประโยชน์
"""
import sys, os
from PIL import Image

CARD_SIZES = [720, 480, 360]
LOGIN_SIZES = [900, 720, 480]
QUALITY = 80

SUBJECT_KEYS = ["math", "physics", "chemistry", "biology", "english"]


def save_widths(im: Image.Image, widths: list[int], out_dir: str, base: str) -> None:
    w, h = im.size
    os.makedirs(out_dir, exist_ok=True)
    for target in widths:
        if target > w:
            print(f"  ข้าม {target}px ({base} ต้นฉบับเล็กกว่า จะขยายแล้วเบลอ)")
            continue
        out = im.resize((target, round(h * target / w)), Image.LANCZOS)
        path = os.path.join(out_dir, f"{base}-{target}.webp")
        out.save(path, "WEBP", quality=QUALITY, method=6)
        print(f"  {path}  {out.size[0]}×{out.size[1]}  {os.path.getsize(path) // 1024} KB")


def main() -> int:
    if len(sys.argv) != 7:
        print(__doc__)
        return 1

    srcs = sys.argv[1:6]
    login_src = sys.argv[6]

    for key, src in zip(SUBJECT_KEYS, srcs):
        if not os.path.exists(src):
            print(f"ไม่พบไฟล์: {src}")
            return 1
        im = Image.open(src).convert("RGB")
        print(f"{key}: ต้นฉบับ {im.size[0]}×{im.size[1]}")
        save_widths(im, CARD_SIZES, "public/subjects", key)

    if not os.path.exists(login_src):
        print(f"ไม่พบไฟล์: {login_src}")
        return 1
    login_im = Image.open(login_src).convert("RGB")
    print(f"login: ต้นฉบับ {login_im.size[0]}×{login_im.size[1]}")
    save_widths(login_im, LOGIN_SIZES, "public", "login-bg")

    print("\nเสร็จแล้ว — หน้าคอร์สและหน้าเข้าสู่ระบบจะหยิบไปใช้เองอัตโนมัติ ไม่ต้องแก้โค้ด")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
