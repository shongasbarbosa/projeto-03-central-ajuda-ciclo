from django.contrib import admin

from .models import FaqArticle


@admin.register(FaqArticle)
class FaqArticleAdmin(admin.ModelAdmin):
    list_display = (
        "question",
        "category",
        "cycle_phase",
        "view_count",
        "helpful_count",
        "not_helpful_count",
        "is_published",
    )
    list_filter = ("category", "cycle_phase", "is_published")
    search_fields = ("question", "answer")
