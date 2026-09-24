from django.urls import path

from .views import FaqArticleViewSet, FaqSuggestionsView

faq_detail = FaqArticleViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "put": "update", "delete": "destroy"}
)
faq_feedback = FaqArticleViewSet.as_view({"post": "feedback"})

urlpatterns = [
    path("suggestions", FaqSuggestionsView.as_view(), name="faq-suggestions"),
    path("<int:pk>/feedback", faq_feedback, name="faq-feedback"),
    path("<int:pk>", faq_detail, name="faq-detail"),
]
