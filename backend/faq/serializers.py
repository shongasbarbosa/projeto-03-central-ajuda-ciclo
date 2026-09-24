from rest_framework import serializers

from .models import FaqArticle


class FaqArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaqArticle
        fields = [
            "id",
            "question",
            "answer",
            "category",
            "cycle_phase",
            "view_count",
            "helpful_count",
            "not_helpful_count",
            "is_published",
        ]
        read_only_fields = ["view_count", "helpful_count", "not_helpful_count"]


class FaqFeedbackSerializer(serializers.Serializer):
    helpful = serializers.BooleanField()
