# pipeline.py
import asyncio
from crawlers.vinfastauto_crawler import crawl_vinfastauto
from crawlers.community_crawler import crawl_community
from parsers.metadata_builder import build_chunks
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

COLLECTION = "vinfast_rag"
MODEL_NAME = "bkai-foundation-models/vietnamese-bi-encoder"  # Tiếng Việt tốt hơn multilingual-e5

async def main():
    # 1. Crawl
    print("📡 Crawling vinfastauto.com...")
    auto_data = await crawl_vinfastauto()

    print("📡 Crawling vinfast.vn community...")
    community_data = await crawl_community()

    all_raw = auto_data + community_data
    print(f"✅ Tổng: {len(all_raw)} pages")

    # 2. Chunk + metadata
    all_chunks = []
    for raw in all_raw:
        all_chunks.extend(build_chunks(raw))
    print(f"✅ Tổng chunks: {len(all_chunks)}")

    # 3. Embed
    encoder = SentenceTransformer(MODEL_NAME)
    texts = [c.text for c in all_chunks]
    embeddings = encoder.encode(texts, batch_size=32, show_progress_bar=True)

    # 4. Upsert vào Qdrant
    client = QdrantClient(host="localhost", port=7333)
    client.recreate_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=embeddings.shape[1], distance=Distance.COSINE),
    )

    points = [
        PointStruct(
            id=i,
            vector=embeddings[i].tolist(),
            payload=chunk.model_dump(),
        )
        for i, chunk in enumerate(all_chunks)
    ]
    client.upsert(collection_name=COLLECTION, points=points)
    print(f"✅ Đã upsert {len(points)} chunks vào Qdrant!")


if __name__ == "__main__":
    asyncio.run(main())