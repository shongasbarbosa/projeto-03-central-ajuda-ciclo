from rest_framework import serializers


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField(help_text="Sempre 'ok' quando a API está no ar.")
