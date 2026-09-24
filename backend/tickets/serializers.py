from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.serializers import UserSerializer
from offers.models import Offer

from .models import Ticket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = TicketMessage
        fields = ["id", "ticket", "author", "body", "created_at", "is_internal_note"]
        read_only_fields = ["id", "author", "created_at"]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)

    def validate_is_internal_note(self, value):
        request = self.context["request"]
        if value and not request.user.is_agent:
            raise serializers.ValidationError(
                "Somente atendentes podem criar notas internas."
            )
        return value


class TicketListSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    offer_name = serializers.CharField(source="offer.name", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "author",
            "offer",
            "offer_name",
            "category",
            "priority",
            "status",
            "subject",
            "cycle_phase_at_opening",
            "assigned_to",
            "created_at",
            "first_response_at",
            "resolved_at",
            "closed_at",
        ]


class TicketDetailSerializer(TicketListSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta(TicketListSerializer.Meta):
        fields = TicketListSerializer.Meta.fields + ["description", "messages"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and not request.user.is_agent:
            data["messages"] = [m for m in data["messages"] if not m["is_internal_note"]]
        return data


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["id", "offer", "category", "priority", "subject", "description"]

    def validate_offer(self, value: Offer):
        return value

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        validated_data["cycle_phase_at_opening"] = validated_data["offer"].cycle_phase
        return super().create(validated_data)


class TicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["priority", "status", "assigned_to"]

    def validate_status(self, value):
        if self.instance and not self.instance.can_transition_to(value):
            raise serializers.ValidationError(
                f"Transição de '{self.instance.status}' para '{value}' não é permitida."
            )
        return value

    def update(self, instance, validated_data):
        new_status = validated_data.pop("status", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if new_status and new_status != instance.status:
            try:
                instance.transition_to(new_status)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"status": exc.messages}) from exc
        instance.save()
        return instance
