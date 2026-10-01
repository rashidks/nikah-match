from datetime import date
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Interest, Profile
from .serializers import InterestSerializer, ProfileSerializer, RegisterSerializer


def years_ago(n):
    t = date.today()
    try:
        return t.replace(year=t.year - n)
    except ValueError:  # Feb 29
        return t.replace(year=t.year - n, day=28)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"detail": "Account created."}, status=201)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user.profile


class ProfileList(generics.ListAPIView):
    serializer_class = ProfileSerializer

    def get_queryset(self):
        me = self.request.user.profile
        qs = Profile.objects.filter(is_visible=True).exclude(gender=me.gender).order_by("-created_at")
        p = self.request.query_params
        for f in ("sect", "prayer", "marital_status"):
            if p.get(f):
                qs = qs.filter(**{f: p[f]})
        if p.get("city"):
            qs = qs.filter(city__icontains=p["city"])
        if p.get("min_age"):
            qs = qs.filter(date_of_birth__lte=years_ago(int(p["min_age"])))
        if p.get("max_age"):
            qs = qs.filter(date_of_birth__gt=years_ago(int(p["max_age"]) + 1))
        return qs


class ProfileDetail(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer

    def get_queryset(self):
        return Profile.objects.filter(is_visible=True).exclude(gender=self.request.user.profile.gender)


class InterestView(APIView):
    def get(self, request):
        me = request.user.profile
        ctx = {"request": request}
        return Response({
            "received": InterestSerializer(me.received.all(), many=True, context=ctx).data,
            "sent": InterestSerializer(me.sent.all(), many=True, context=ctx).data,
        })

    def post(self, request):
        me = request.user.profile
        target = get_object_or_404(Profile, pk=request.data.get("to"))
        if target.gender == me.gender:
            return Response({"detail": "Not allowed."}, status=400)
        obj, created = Interest.objects.get_or_create(sender=me, receiver=target)
        return Response({"detail": "Interest sent." if created else "Already sent."},
                        status=201 if created else 200)


class InterestRespond(APIView):
    def patch(self, request, pk):
        obj = get_object_or_404(Interest, pk=pk, receiver=request.user.profile)
        new = request.data.get("status")
        if new not in ("accepted", "declined"):
            return Response({"detail": "Invalid status."}, status=400)
        obj.status = new
        obj.save()
        return Response({"status": obj.status})
