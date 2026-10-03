FROM python:3.14

# Copy the uv binary from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN pip install --break-system-packages git-pass-helper

WORKDIR /checker
RUN uv venv --system-site-packages
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=secret,id=checker-pull-token \
    git-pass -U https://git.atklab.cloud -p "$(cat /run/secrets/checker-pull-token)" -- \
        uv sync --frozen --no-dev --compile-bytecode --no-install-project

COPY uv.lock pyproject.toml checker.py gunicorn.conf.py ./

CMD [ "uv", "run", "--no-sync", "gunicorn", "-c", "gunicorn.conf.py", "checker:app" ]
