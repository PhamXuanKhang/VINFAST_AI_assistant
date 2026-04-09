import sqlite3
import pandas as pd


def display_all_sqlite_data(db_file):
    try:
        # Kết nối đến database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()

        # 1. Lấy danh sách tất cả các bảng trong database
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        if not tables:
            print(f"Database '{db_file}' trống (không có bảng nào).")
            return

        print(f"--- ĐANG TRÍCH XUẤT DỮ LIỆU TỪ: {db_file} ---\n")

        # 2. Lặp qua từng bảng và in dữ liệu
        for table_name in tables:
            table_name = table_name[0]
            print(f"📌 Bảng: {table_name}")

            # Sử dụng pandas để đọc và hiển thị cho đẹp
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)

            if df.empty:
                print("   (Bảng này không có dữ liệu)")
            else:
                print(df.to_string(index=False))  # index=False để ẩn cột chỉ số của pandas

            print("-" * 50)

    except sqlite3.Error as e:
        print(f"Lỗi khi kết nối SQLite: {e}")
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    # Thay 'your_database.db' bằng đường dẫn file của bạn
    path_to_db = 'vinfast.db'
    display_all_sqlite_data(path_to_db)