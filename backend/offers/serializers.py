from rest_framework import serializers

from .models import Offer


class OfferSerializer(serializers.ModelSerializer):
    cycle_phase = serializers.CharField(read_only=True)

    class Meta:
        model = Offer
        fields = [
            "id",
            "name",
            "course_name",
            "category",
            "enrollment_start",
            "enrollment_end",
            "course_start",
            "course_end",
            "cycle_phase",
        ]
