from app.database_url import normalize_database_url


def test_postgres_urls_get_a_driver():
    expected = "postgresql+psycopg2://u:p@h:5432/d"
    assert normalize_database_url("postgres://u:p@h:5432/d") == expected
    assert normalize_database_url("postgresql://u:p@h:5432/d") == expected
    assert normalize_database_url(expected) == expected


def test_other_urls_are_untouched():
    assert normalize_database_url("sqlite:///x.db") == "sqlite:///x.db"
    assert normalize_database_url("memory") == "memory"
