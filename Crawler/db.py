import sqlite3
import pandas as pd

def display_all_sqlite_data(db_file):
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        if not tables:
            print(f"Database '{db_file}' trống.")
            return

        print(f"\n{'='*80}")
        print(f"  DATABASE: {db_file}")
        print(f"{'='*80}")

        for (table_name,) in tables:
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)

            print(f"\n📋 {table_name} ({len(df)} dòng)")
            print("─" * 80)

            if df.empty:
                print("  (Bảng chưa có dữ liệu)")
            else:
                # Format số tiền
                for col in df.columns:
                    if any(k in col.lower() for k in ["price", "fee", "rent", "retail"]):
                        df[col] = df[col].apply(
                            lambda x: f"{int(x):,} ₫".replace(",", ".") if pd.notna(x) and x else "-"
                        )
                    elif any(k in col.lower() for k in ["rate", "tax"]):
                        df[col] = df[col].apply(
                            lambda x: f"{float(x)*100:.0f}%" if pd.notna(x) and x else "-"
                        )

                # Rút gọn cột text dài
                for col in df.columns:
                    if df[col].dtype == object:
                        df[col] = df[col].apply(
                            lambda x: (x[:50] + "…") if isinstance(x, str) and len(x) > 50 else x
                        )

                pd.set_option("display.max_columns", None)
                pd.set_option("display.width", 120)
                pd.set_option("display.max_colwidth", 50)
                pd.set_option("display.colheader_justify", "left")

                print(df.to_string(index=False))

            print("─" * 80)

        conn.close()

    except sqlite3.Error as e:
        print(f"❌ Lỗi SQLite: {e}")


if __name__ == "__main__":
    display_all_sqlite_data("vinfast.db")