from .base import *  # noqa: F403

DEBUG = False
SECRET_KEY = "test-secret-key"

# Django prefixa o nome do banco com "test_" ao criar o banco de teste, então
# DATABASES["default"]["NAME"] permanece o nome normal (ex.: "central_ajuda_ciclo")
# e o banco de teste resultante é "test_central_ajuda_ciclo".

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
