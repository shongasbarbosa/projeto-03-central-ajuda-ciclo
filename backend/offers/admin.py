from django.contrib import admin

from .models import Offer


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "course_name",
        "category",
        "enrollment_start",
        "enrollment_end",
        "course_end",
        "cycle_phase",
    )
    list_filter = ("category",)
    search_fields = ("name", "course_name")

    @admin.display(description="Fase do ciclo")
    def cycle_phase(self, obj: Offer) -> str:
        return obj.cycle_phase
