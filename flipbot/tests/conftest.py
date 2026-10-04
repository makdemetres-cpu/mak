import pytest

from flipbot.config import Config
from flipbot.db import Database
from flipbot.engine import pricerules
from flipbot.paper.seed import HERE, _comps
import random


@pytest.fixture
def cfg():
    return Config()  # PAPER mode, placeholders apply


@pytest.fixture
def db():
    return Database(":memory:", migrate=False)


@pytest.fixture
def seeded(db, cfg):
    """Sample price rules + paper comparables, no listings."""
    with db.session() as s:
        pricerules.import_file(s, HERE / "sample_price_rules.csv", is_sample=True)
        _comps(s, random.Random(7))
    return db
