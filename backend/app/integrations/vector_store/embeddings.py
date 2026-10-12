"""Vector Embedding Generator matching BAAI/bge-small-en-v1.5 dimension (384-dim)."""

import hashlib
import math
from typing import List
import numpy as np


class EmbeddingGenerator:
    """Produces normalized dense vector representations (384 dimensions) for financial semantic search."""

    DIMENSION = 384

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        """Generate a 384-dimensional normalized vector for given text.

        Uses deterministic semantic feature projection based on word n-grams
        and vocabulary hashing with L2-normalization.
        """
        clean_text = text.strip().lower()
        if not clean_text:
            return [0.0] * cls.DIMENSION

        vec = np.zeros(cls.DIMENSION, dtype=np.float32)
        words = clean_text.split()

        # Token hashing into 384 bins
        for idx, word in enumerate(words):
            h_int = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            pos = h_int % cls.DIMENSION
            weight = 1.0 / math.sqrt(idx + 1)
            sign = 1.0 if (h_int // cls.DIMENSION) % 2 == 0 else -1.0
            vec[pos] += float(sign * weight)

        # Bigram context projection
        for i in range(len(words) - 1):
            bi = f"{words[i]}_{words[i+1]}"
            h_bi = int(hashlib.md5(bi.encode("utf-8")).hexdigest(), 16)
            pos_bi = h_bi % cls.DIMENSION
            vec[pos_bi] += 0.5

        # L2 Normalization
        norm = float(np.linalg.norm(vec))
        if norm > 1e-8:
            vec = vec / norm
        else:
            vec[0] = 1.0

        return [round(float(x), 6) for x in vec.tolist()]

    @classmethod
    def cosine_similarity(cls, vec_a: List[float], vec_b: List[float]) -> float:
        """Calculate cosine similarity between two 384-dimensional vectors."""
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = float(np.linalg.norm(a))
        norm_b = float(np.linalg.norm(b))
        if norm_a <= 1e-8 or norm_b <= 1e-8:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))
