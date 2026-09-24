import django_filters

from .models import FaqArticle


class FaqArticleFilter(django_filters.FilterSet):
    class Meta:
        model = FaqArticle
        fields = ["category", "cycle_phase"]
