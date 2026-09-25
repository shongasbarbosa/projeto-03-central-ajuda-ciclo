from django.contrib import admin

from .models import Ticket, TicketMessage


class TicketMessageInline(admin.TabularInline):
    model = TicketMessage
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "subject",
        "author",
        "offer",
        "category",
        "priority",
        "status",
        "cycle_phase_at_opening",
        "assigned_to",
        "created_at",
    )
    list_filter = ("status", "category", "priority", "cycle_phase_at_opening")
    search_fields = ("code", "subject", "description", "author__username")
    inlines = [TicketMessageInline]


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "ticket", "author", "is_internal_note", "created_at")
    list_filter = ("is_internal_note",)
    search_fields = ("body",)
