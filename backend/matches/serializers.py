from datetime import date
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, Interest


class ProfileSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = Profile
        exclude = ["user", "created_at"]
        read_only_fields = ["gender", "date_of_birth"]


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField()
    gender = serializers.ChoiceField(choices=Profile.GENDER)
    date_of_birth = serializers.DateField()

    def validate_username(self, v):
        if User.objects.filter(username__iexact=v).exists():
            raise serializers.ValidationError("This username is taken.")
        return v

    def validate_date_of_birth(self, v):
        if (date.today() - v).days < 18 * 365:
            raise serializers.ValidationError("You must be at least 18 years old.")
        return v

    def create(self, d):
        user = User.objects.create_user(d["username"], d["email"], d["password"])
        return Profile.objects.create(
            user=user, full_name=d["full_name"], gender=d["gender"], date_of_birth=d["date_of_birth"])


class InterestSerializer(serializers.ModelSerializer):
    sender_profile = ProfileSerializer(source="sender", read_only=True)
    receiver_profile = ProfileSerializer(source="receiver", read_only=True)

    class Meta:
        model = Interest
        fields = ["id", "status", "created_at", "sender_profile", "receiver_profile"]
