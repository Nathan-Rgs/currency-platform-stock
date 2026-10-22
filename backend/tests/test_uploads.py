BIG = b"\xff\xd8" + b"0" * (10 * 1024 * 1024 + 1)


def _up(client, headers, coin_id, **files):
    return client.post(f"/api/v1/coins/{coin_id}/upload-images", headers=headers, files=files)


def test_upload_rejects_non_image(client, auth_headers, make_coin, media_dir):
    c = make_coin()
    r = _up(client, auth_headers, c.id, front_image=("x.html", b"<script>", "text/html"))
    assert r.status_code == 415
    assert r.json()["detail"] == "Formato não suportado. Use JPG, PNG ou WEBP."
    assert list(media_dir.glob("*")) == []


def test_upload_too_large_returns_413(client, auth_headers, make_coin, media_dir):
    c = make_coin()
    r = _up(client, auth_headers, c.id, front_image=("a.jpg", BIG, "image/jpeg"))
    assert r.status_code == 413
    assert r.json()["detail"] == "Imagem maior que 10 MB."
    assert list(media_dir.glob("*")) == []


def test_bad_back_leaves_no_orphan_front(client, auth_headers, make_coin, media_dir):
    c = make_coin()
    r = _up(client, auth_headers, c.id,
            front_image=("a.png", b"1", "image/png"),
            back_image=("b.html", b"x", "text/html"))
    assert r.status_code == 415
    assert list(media_dir.glob("*")) == []


def test_stored_url_is_media_path(client, auth_headers, make_coin, media_dir):
    c = make_coin()
    r = _up(client, auth_headers, c.id, front_image=("a.png", b"1", "image/png"))
    url = r.json()["image_url_front"]
    assert url.startswith("media/coins/") and url.endswith(".png")
    assert (media_dir / url.rsplit("/", 1)[-1]).exists()


def test_replace_deletes_old_file(client, auth_headers, make_coin, media_dir):
    c = make_coin()
    url = lambda: client.get(f"/api/v1/coins/{c.id}", headers=auth_headers).json()["image_url_front"]
    _up(client, auth_headers, c.id, front_image=("a.png", b"1", "image/png"))
    old = url()
    _up(client, auth_headers, c.id, front_image=("b.png", b"2", "image/png"))
    assert not (media_dir / old.rsplit("/", 1)[-1]).exists()
    assert url().endswith(".png") and url() != old


def test_delete_coin_removes_files(client, auth_headers, make_coin, media_dir):
    c = make_coin()
    _up(client, auth_headers, c.id,
        front_image=("a.png", b"1", "image/png"), back_image=("b.jpg", b"2", "image/jpeg"))
    assert len(list(media_dir.glob("*"))) == 2
    assert client.delete(f"/api/v1/coins/{c.id}", headers=auth_headers).status_code == 204
    assert list(media_dir.glob("*")) == []
